/**
 * External Dependencies
 */
import React, { PropTypes, PureComponent } from 'react';
import classnames from 'classnames';
import { debounce, throttle } from 'lodash';

// tween.js has references to window on its initial run. So, if that doesn't exist,
// we don't want to import that library.
let TWEEN = {};
if ( typeof window !== 'undefined' ) {
	TWEEN = require( 'tween.js' );
}

/**
 * Internal Dependencies
 */
import ScrollTrack from './ScrollTrack';
import { BASE_CLASS } from './constants';
import { throttleToFrame, eventInsideRect } from './helpers/events';
import { calcThumbSize, calcThumbOffset, browserScrollbarWidth } from './helpers/dimensions';

/**
 * This component will wrap content and create custom scroll bars for said content.  Due to requirements
 * for automatically fading content in and out, Webkit's CSS customization for scroll bars can not be
 * used.
 *
 * @export
 * @class ScrollContainer
 * @extends {PureComponent}
 */
export default class ScrollContainer extends PureComponent {
	static propTypes = {
		autoHide: PropTypes.bool,
		children: PropTypes.node,
		className: PropTypes.string,
		direction: PropTypes.oneOf( [ 'vertical', 'horizontal', 'both' ] ),
	};

	static defaultProps = {
		autoHide: false,
		direction: 'vertical',
	};

	constructor( props ) {
		super( props );
		this.state = {
			canScrollHorizontal: false,
			canScrollVertical: false,
			draggingThumb: false,
			forceVisible: ! this.props.autoHide,
			horizontalThumbHovered: false,
			horizontalThumbOffset: 0,
			horizontalThumbSize: 0,
			horizontalTrackHeight: 0,
			horizontalTrackHovered: false,
			verticalThumbHovered: false,
			verticalThumbOffset: 0,
			verticalThumbSize: 0,
			verticalTrackWidth: 0,
			verticalTrackHovered: false,
		};
		this.contentContainerRefFn = n => this.contentContainer = n;
		this.horizontalTrackRefFn = c => this.horizontalTrack = c;
		this.rootNodeRefFn = n => this.rootNode = n;
		this.verticalTrackRefFn = c => this.verticalTrack = c;

		this.contentScrollHandler = throttleToFrame( () => {
			this.updateThumbPosition();
			this.scrollComplete();
		} );
		this.contentUpdateHandler = throttle( () => {
			this.canScroll();
			this.calculateTrackRectangles();
			this.updateThumb();
		}, 100, { leading: false } );
		this.coordinatesOverTrack = throttleToFrame( this.coordinatesOverTrack );
		this.scrollByDragging = throttleToFrame( this.scrollByDragging );
		this.scrollComplete = debounce( this.autoHideAfterScroll, 333, { leading: true, trailing: true } );
		this.windowResizeHandler = throttleToFrame( () => {
			this.canScroll();
			this.calculateTrackRectangles();
			this.updateThumb();
		} );

		this.dragThumb = event => {
			const { clientX, clientY } = event;
			this.scrollByDragging( clientX, clientY );
		};
		this.trackMouseOnHover = event => {
			const { clientX, clientY } = event;
			this.coordinatesOverTrack( clientX, clientY );
		};
	}

	componentDidMount = () => {
		if ( typeof window !== 'undefined' ) {
			window.addEventListener( 'resize', this.windowResizeHandler );
		}
		this.updateScrollbar();
	}

	componentDidUpdate( prevProps, prevState ) {
		if (
			prevState.verticalTrackHovered !== this.state.verticalTrackHovered ||
			prevState.horizontalTrackHovered !== this.state.horizontalTrackHovered
		) {
			this.calculateTrackRectangles();
		}

		if ( typeof window !== 'undefined' && prevState.draggingThumb !== this.state.draggingThumb ) {
			if ( this.state.draggingThumb ) {
				window.addEventListener( 'mousemove', this.dragThumb );
				window.addEventListener( 'mouseup', this.stopDragging );
			} else {
				window.removeEventListener( 'mousemove', this.dragThumb );
				window.removeEventListener( 'mouseup', this.stopDragging );
			}
		}
	}

	componentWillUnmount = () => {
		if ( typeof window !== 'undefined' ) {
			window.removeEventListener( 'mousemove', this.dragThumb );
			window.removeEventListener( 'mouseup', this.stopDragging );
			window.removeEventListener( 'resize', this.windowResizeHandler );
		}

		// Just to be safe
		this.stopScrolling();

		/*
		There's a possibility that since these functions are the result of currying
		another function which has the initial function which is boudn to the component
		instance in the scope chain, the curried function will keep the component in
		memory even after the component is unmounted.  Since this is inexpensive,
		let's just cancel (if possible) and assign over these to prevent memory leaks.
		*/
		this.contentScrollHandler = null;
		this.contentUpdateHandler.cancel();
		this.contentUpdateHandler = null;
		this.coordinatesOverTrack = null;
		this.scrollByDragging = null;
		this.scrollComplete.cancel();
		this.scrollComplete = null;
		this.windowResizeHandler = null;
	}

	autoHideAfterScroll = () => {
		if ( this.props.autoHide && ! this.state.draggingThumb ) {
			this.setState( () => ( { forceVisible: false } ) );
		}
	}

	calculateTrackRectangles = () => {
		this.setState( state => {
			const newState = {};
			if ( state.canScrollHorizontal || state.canScrollVertical ) {
				if ( state.canScrollHorizontal && this.horizontalTrack != null ) {
					const horizontalTrackRect = this.horizontalTrack.getBoundingClientRect();
					if ( horizontalTrackRect.height > 0 ) {
						newState.horizontalTrackRect = horizontalTrackRect;
					}
				}
				if ( state.canScrollVertical && this.verticalTrack != null ) {
					const verticalTrackRect = this.verticalTrack.getBoundingClientRect();
					if ( verticalTrackRect.width > 0 ) {
						newState.verticalTrackRect = verticalTrackRect;
					}
				}
				return newState;
			}
			return null;
		} );
	}

	canScroll = () => {
		const content = this.contentContainer;
		const scrollState = {
			canScrollHorizontal: this.props.direction !== 'vertical' && content.clientWidht < content.scrollWidth,
			canScrollVertical: this.props.direction !== 'horizontal' && content.clientHeight < content.scrollHeight,
		};
		this.setState( () => scrollState );
	}

	clearTrackState = () => {
		this.setState( () => ( {
			draggingThumb: false,
			horizontalThumbHovered: false,
			horizontalTrackHovered: false,
			horizontalTrackRect: null,
			verticalThumbHovered: false,
			verticalTrackHovered: false,
			verticalTrackRect: null,
		} ) );
	}

	/**
	 * Determine if a given set of X/Y client coordinates is on top of a visible scrollbar track.
	 *
	 * @private
	 * @param {Number} x - X Coordinate
	 * @param {Number} y - Y Coordinate
	 * @memberof ScrollContainer
	 */
	coordinatesOverTrack = ( x, y ) => {
		this.setState( state => {
			const { horizontalTrackRect, verticalTrackRect } = state;
			if ( horizontalTrackRect == null && verticalTrackRect == null ) {
				return this.calculateTrackRectangles;
			}
			const fakeEvent = { clientX: x, clientY: y };
			const newState = {};
			if ( state.canScrollHorizontal ) {
				newState.horizontalTrackHovered = horizontalTrackRect == null ? false : eventInsideRect( fakeEvent, horizontalTrackRect );
				newState.horizontalThumbHovered = false;
				if ( newState.horizontalTrackHovered ) {
					const thumbLeft = horizontalTrackRect.left + state.horizontalThumbOffset;
					newState.horizontalThumbHovered = y >= thumbLeft && y <= thumbLeft + state.horizontalThumbSize;
				}
			}
			if ( state.canScrollVertical ) {
				newState.verticalTrackHovered = verticalTrackRect == null ? false : eventInsideRect( fakeEvent, verticalTrackRect );
				newState.verticalThumbHovered = false;
				if ( newState.verticalTrackHovered ) {
					const thumbTop = verticalTrackRect.top + state.verticalThumbOffset;
					newState.verticalThumbHovered = x >= thumbTop && x <= thumbTop + state.verticalThumbSize;
				}
			}

			if (
				state.horizontalTrackHovered !== newState.horizontalTrackHovered ||
				state.verticalTrackHovered !== newState.verticalTrackHovered
			) {
				this.calculateTrackRectangles();
			}
			return newState;
		} );
	}

	/**
	 * Scroll the content based on the current clientX and clientY of the mouse.
	 *
	 * @param {Number} clientX - X coordinate of the mouse with (0, 0) at the top left of the window
	 * @param {Number} clientY - Y coordinate of the mouse with (0, 0) at the top left of the window
	 * @memberof ScrollContainer
	 */
	scrollByDragging = ( clientX, clientY ) => {
		const { clientHeight, scrollHeight } = this.contentContainer;
		const scrollProperty = this.state.horizontalTrackHovered ? 'scrollLeft' : 'scrollTop';
		const currentPosition = this.state.horizontalTrackHovered ? clientX : clientY;
		const trackDiff = currentPosition - this.state.dragStartPosition;
		const scrollDiff = scrollHeight / clientHeight * trackDiff;
		this.contentContainer[ scrollProperty ] = this.state.startingScrollPosition + scrollDiff;
	}

	/**
	 * After scrolling has completed, prevent a click event from landing on the content,
	 * reset dragging state, and execute mouseleave handlers if the mouse is no longer
	 * inside of this container.
	 *
	 * @param {MouseEvent} event - The mouseup event which caused scrolling to stop.
	 * @memberof ScrollContainer
	 */
	stopDragging = event => {
		event.preventDefault();
		event.stopPropagation();
		if ( ! this.rootNode.contains( event.target ) ) {
			this.clearTrackState();
		}
		this.setState( () => ( {
			draggingThumb: false,
			dragStartPosition: null,
			forceVisible: false,
			startingScrollPosition: null,
		} ) );
	}

	/**
	 * If the user clicks on a scroll track, but outside of its associated scroll thumb,
	 * we need to either increase or decrease the amount of scrolling by a single "page".
	 *
	 * @private
	 * @param {MouseEvent} event - The mouse event triggered in the UI
	 * @memberof ScrollContainer
	 */
	scrollIfClickOnTrack = event => {
		const { clientX, clientY } = event;
		const { horizontalTrackRect, verticalTrackRect } = this.state;
		const { clientHeight, clientWidth, scrollTop, scrollLeft } = this.contentContainer;

		if ( verticalTrackRect != null && eventInsideRect( event, verticalTrackRect ) ) {
			event.preventDefault();
			event.stopPropagation();
			const { verticalThumbOffset, verticalThumbSize } = this.state;
			const clickedBelowThumb = clientY > verticalTrackRect.top + verticalThumbOffset + verticalThumbSize;
			const clickedAboveThumb = clientY < verticalTrackRect.top + verticalThumbOffset;
			let scrollYTarget = scrollTop;
			const startDragging = () => this.setState( () => ( {
				draggingThumb: true,
				dragStartPosition: clientY,
				forceVisible: true,
				startingScrollPosition: scrollYTarget,
				verticalThumbHovered: true,
			} ) );
			if ( clickedAboveThumb || clickedBelowThumb ) {
				scrollYTarget = clickedAboveThumb ? scrollTop - clientHeight : scrollTop + clientHeight;
				this.scrollTo( scrollLeft, scrollYTarget, startDragging );
			} else {
				startDragging();
			}
		} else if ( horizontalTrackRect != null && eventInsideRect( event, horizontalTrackRect ) ) {
			event.preventDefault();
			event.stopPropagation();
			const { horizontalThumbOffset, horizontalThumbSize } = this.state;
			const clickedLeftThumb = clientX > horizontalTrackRect.left + horizontalThumbOffset + horizontalThumbSize;
			const clickedRightThumb = clientX < horizontalTrackRect.left + horizontalThumbOffset;
			let scrollXTarget = scrollLeft;
			const startDragging = () => this.setState( () => ( {
				draggingThumb: true,
				dragStartPosition: clientX,
				forceVisible: true,
				horizontalThumbHovered: true,
				startingScrollPosition: scrollXTarget,
			} ) );
			if ( clickedRightThumb || clickedLeftThumb ) {
				scrollXTarget = clickedRightThumb ? scrollLeft - clientWidth : scrollLeft + clientWidth;
				this.scrollTo( scrollXTarget, scrollTop, startDragging );
			} else {
				startDragging();
			}
		}
	}

	/**
	 * Scroll the contentes of this container to the given x/y coordinates.
	 *
	 * @private
	 * @param {Number} x - The amount of desired horizontal scrolling
	 * @param {Number} y - The amount of desired vertical scrolling
	 * @param {Function} [cb] - Callback to execute after scrolling
	 * @memberof ScrollContainer
	 */
	scrollTo = ( x, y, cb ) => {
		if ( this.scrollTween != null ) {
			this.scrollTween.stop();
		}
		this.setState( () => ( { scrolling: true } ), () => {
			const scrollContainer = this;
			this.scrollTween = new TWEEN.Tween( {
				x: this.contentContainer.scrollLeft || 0,
				y: this.contentContainer.scrollTop || 0,
			} )
			.to( {
				x: Math.max( x || 0, 0 ),
				y: Math.max( y || 0, 0 ),
			}, 75 )
			.onUpdate( function() {
				scrollContainer.contentContainer.scrollTop = this.y;
				scrollContainer.contentContainer.scrollLeft = this.x;
			} )
			.easing( TWEEN.Easing.Linear.None )
			.interpolation( TWEEN.Interpolation.Bezier )
			.onComplete( () => {
				this.stopScrolling();
				if ( typeof cb === 'function' ) {
					cb();
				}
			} )
			.start();
			const tweenUpdateFn = time => {
				if ( this.state.scrolling ) {
					TWEEN.update( time );
					requestAnimationFrame( tweenUpdateFn );
				}
			};
			requestAnimationFrame( tweenUpdateFn );
		} );
	}

	/**
	 * If the mouse is on top of the track, we have to manually stop the event from
	 * landing on the underlying content since the track doesn't accept pointer events.
	 *
	 * @param {MouseEvent} event - The click event we might need to kill.
	 * @memberof ScrollContainer
	 */
	stopClickOnTrackOver = event => {
		const { verticalTrackHovered, horizontalTrackHovered } = this.state;
		if ( verticalTrackHovered || horizontalTrackHovered ) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	stopScrolling = () => {
		if ( this.scrollTween != null ) {
			this.scrollTween.stop();
		}
		this.setState( () => ( { scrolling: false } ) );
	}

	updateScrollbar = () => {
		this.canScroll();
		this.calculateTrackRectangles();
		this.updateThumb();
	}

	updateThumb = () => {
		this.updateThumbSize();
		this.updateThumbPosition();
	}

	updateThumbPosition = () => {
		const { scrollHeight, scrollWidth, clientHeight, clientWidth, scrollTop, scrollLeft } = this.contentContainer;
		const { direction } = this.props;
		this.setState( state => {
			const newState = {};
			if ( state.canScrollHorizontal ) {
				newState.horizontalThumbOffset = calcThumbOffset( clientWidth, scrollWidth, scrollLeft, direction );
			}
			if ( state.canScrollVertical ) {
				newState.verticalThumbOffset = calcThumbOffset( clientHeight, scrollHeight, scrollTop, direction );
			}
			return newState;
		} );
	}

	updateThumbSize = () => {
		this.setState( ( state, props ) => {
			const { scrollHeight, scrollWidth, clientHeight, clientWidth } = this.contentContainer;
			const { direction } = props;
			const newState = {};
			if ( state.canScrollHorizontal ) {
				newState.horizontalThumbSize = calcThumbSize( clientWidth, scrollWidth, direction );
			}
			if ( state.canScrollVertical ) {
				newState.verticalThumbSize = calcThumbSize( clientHeight, scrollHeight, direction );
			}
			return newState;
		} );
	}

	render() {
		const { className, autoHide, children, direction } = this.props;
		const { canScrollHorizontal, canScrollVertical } = this.state;
		const {
			draggingThumb,
			forceVisible,
			horizontalThumbHovered,
			horizontalThumbOffset,
			horizontalThumbSize,
			horizontalTrackHovered,
			scrolling,
			verticalThumbHovered,
			verticalThumbOffset,
			verticalThumbSize,
			verticalTrackHovered,
		} = this.state;
		const browserScrollbarPadding = `-${ browserScrollbarWidth }px`;
		const classes = classnames( BASE_CLASS, `${ BASE_CLASS }__${ direction }`, className, {
			[ `${ BASE_CLASS }-autohide` ]: autoHide,
			[ `${ BASE_CLASS }-dragging` ]: draggingThumb,
			[ `${ BASE_CLASS }__force-visible` ]: forceVisible,
		} );
		const scrollbarClipStyles = {
			marginRight: direction !== 'horizontal' ? browserScrollbarPadding : null,
			marginBottom: direction !== 'vertical' ? browserScrollbarPadding : null,
		};
		return (
			<div
				ref={ this.rootNodeRefFn }
				className={ classes }
				onMouseEnter={ this.calculateTrackRectangles }
				onMouseLeave={ draggingThumb ? null : this.clearTrackState }
			>
				<div
					ref={ this.contentContainerRefFn }
					className={ `${ BASE_CLASS }__content-container` }
					onScroll={ this.contentScrollHandler }
					onClick={ this.contentUpdateHandler }
					onClickCapture={ this.stopClickOnTrackOver }
					onKeyDown={ this.contentUpdateHandler }
					onMouseDownCapture={ this.scrollIfClickOnTrack }
					onMouseMove={ scrolling || draggingThumb ? null : this.trackMouseOnHover }
					style={ scrollbarClipStyles }
				>
					{ children }
				</div>
				{
					canScrollVertical
					? <ScrollTrack
						direction="vertical"
						refFn={ this.verticalTrackRefFn }
						thumbHovered={ verticalThumbHovered }
						thumbOffset={ verticalThumbOffset }
						thumbSize={ verticalThumbSize }
						trackHovered={ verticalTrackHovered }
					/>
					: null
				}
				{
					canScrollHorizontal
					? <ScrollTrack
						direction="horizontal"
						refFn={ this.horizontalTrackRefFn }
						thumbHovered={ horizontalThumbHovered }
						thumbOffset={ horizontalThumbOffset }
						thumbSize={ horizontalThumbSize }
						trackHovered={ horizontalTrackHovered }
					/>
					: null
				}
			</div>
		);
	}
}
