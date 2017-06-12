/**
 * External Dependencies
 */
import React, { PropTypes, PureComponent } from 'react';
import classnames from 'classnames';
import scrollbarWidth from 'scrollbar-width';
import { debounce, throttle } from 'lodash';

/**
 * Internal Dependencies
 */
import ScrollTrack from './ScrollTrack';
import { BASE_CLASS } from './constants';

const browserScrollbarWidth = typeof document === 'undefined' ? 0 : scrollbarWidth();

/**
 * Determine the size of the scroll track given the amount of visible space.  If we're scrolling
 * in both dimensions, the track has to be a bit shorter to prevent overlap of the two tracks.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} scrollDirection - The direction in which the user is allowed to scroll
 * @returns {Number} The size of the scroll track in pixels
 */
function calcTrackSize( visibleSize, scrollDirection ) {
	return scrollDirection === 'both' ? visibleSize - browserScrollbarWidth : visibleSize;
}

/**
 * Determine the size of the scroll thumb (draggable element of the scroll bar) given the
 * amount of visible space and total size of content along a dimension.  The direction the
 * user is allowed to scroll is also needed, due to the restricted amount of available space
 * for the thumb to traverse on the track if the user is allowed to scroll in both dimensions.
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} totalSize - The total number of pixels that the content takes up
 * @param {'vertical'|horizontal'|'both'} scrollDirection - The direction in which the user is allowed to scroll
 * @returns {Number} The size of the thumb in pixels
 */
function calcThumbSize( visibleSize, totalSize, scrollDirection ) {
	const visibleSpace = calcTrackSize( visibleSize, scrollDirection );
	return Math.min( visibleSize / totalSize * visibleSpace, visibleSpace );
}

/**
 * Determine the pixel offset of the thumb from the base of the track given how much the
 * user has scrolled.  The direction the user is allowed to scroll is also needed, due to
 * the restricted amount of available space for the thumb to traverse on the track if the
 * user is allowed to scroll in both dimensions.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} totalSize - The total number of pixels that the content takes up
 * @param {Number} scrollAmount - The number of pixels the user has scrolled in a given dimension
 * @param {'vertical'|'horizontal'|'both'} scrollDirection - The direction in which the user is allowed to scroll
 * @returns {Number} The offset of the thumb from the track base in pixels
 */
function calcThumbOffset( visibleSize, totalSize, scrollAmount, scrollDirection ) {
	const thumbSize = calcThumbSize( visibleSize, totalSize, scrollDirection );
	const trackSize = calcTrackSize( visibleSize, totalSize, scrollDirection );
	const maxOffset = trackSize - thumbSize;
	const proportionScrolled = scrollAmount / totalSize;
	return Math.min( trackSize * proportionScrolled, maxOffset );
}

/**
 * Curry a function which will ensure that the passed function is only executed once per
 * animation frame.
 *
 * @private
 * @param {Function} fn - The function which needs to be executed in the animation frame
 * @returns {Function} A function that can be called any number of times
 */
function throttleToFrame( fn ) {
	let requestingFrame = false;
	return ( ...args ) => {
		if ( ! requestingFrame ) {
			window.requestAnimationFrame( () => {
				requestingFrame = false;
				fn.apply( null, args );
			} );
			requestingFrame = true;
		}
	};
}

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
			forceVisible: ! this.props.autoHide,
			horizontalThumbOffset: 0,
			horizontalThumbSize: 0,
			verticalThumbOffset: 0,
			verticalThumbSize: 0,
		};
		this.contentScrollHandler = throttleToFrame( this.contentScrollHandler );
		this.contentUpdateHandler = throttle( this.updateThumb, 100, { leading: false } );
		this.scrollComplete = debounce( this.autoHideAfterScroll, 333 );
		this.windowResizeHandler = throttleToFrame( this.updateThumb );
	}

	componentDidMount = () => {
		if ( typeof window !== 'undefined' ) {
			window.addEventListener( 'resize', this.windowResizeHandler );
		}
		const { clientHeight, clientWidth, scrollHeight, scrollWidth } = this.contentContainer;
		const verticalThumbSize = calcThumbSize( clientHeight, scrollHeight, this.props.direction );
		const horizontalThumbSize = calcThumbSize( clientWidth, scrollWidth, this.props.direction );
		this.setState( {
			verticalThumbSize,
			horizontalThumbSize
		} );
	}

	componentWillUnmount = () => {
		if ( typeof window !== 'undefined' ) {
			window.removeEventListener( 'resize', this.windowResizeHandler );
		}

		/*
		There's a possibility that since these functions are the result of currying
		another function which has the initial function which is boudn to the component
		instance in the scope chain, the curried function will keep the component in
		memory even after the component is unmounted.  Since this is inexpensive,
		let's just assign over these to prevent memory leaks.
		*/
		this.contentScrollHandler = null;
		this.windowResizeHandler = null;
		this.scrollComplete = null;
	}

	contentScrollHandler = () => {
		this.updateScrollPosition();
		this.autoHideAfterScroll();
	}

	updateThumb = () => {
		this.updateScrollBarSize();
		this.updateScrollPosition();
	}

	autoHideAfterScroll = () => {
		if ( this.props.autoHide ) {
			this.setState( { forceVisible: false } );
		}
	}

	updateScrollBarSize = () => {
		const { scrollHeight, scrollWidth, clientHeight, clientWidth } = this.contentContainer;
		const { direction } = this.props;
		const verticalThumbSize = calcThumbSize( clientHeight, scrollHeight, direction );
		const horizontalThumbSize = calcThumbSize( clientWidth, scrollWidth, direction );
		this.setState( {
			horizontalThumbSize,
			percentVisible: 100,
			verticalThumbSize,
		} );
	}

	updateScrollPosition = () => {
		const { scrollHeight, scrollWidth, clientHeight, clientWidth, scrollTop, scrollLeft } = this.contentContainer;
		const { direction } = this.props;
		const verticalThumbOffset = calcThumbOffset( clientHeight, scrollHeight, scrollTop, direction );
		const horizontalThumbOffset = calcThumbOffset( clientWidth, scrollWidth, scrollLeft, direction );
		this.setState( {
			verticalThumbOffset,
			horizontalThumbOffset,
			forceVisible: true,
		} );
	}

	render() {
		const { className, autoHide, children, direction } = this.props;
		const {
			forceVisible,
			horizontalThumbOffset,
			horizontalThumbSize,
			verticalThumbOffset,
			verticalThumbSize,
		} = this.state;
		const showVerticalScrollbar = direction !== 'horizontal';
		const showHorizontalScrollbar = direction !== 'vertical';
		const browserScrollbarPadding = `-${ browserScrollbarWidth }px`;
		const classes = classnames( BASE_CLASS, `${ BASE_CLASS }__${ direction }`, className, {
			[ `${ BASE_CLASS }__autohide` ]: autoHide,
			[ `${ BASE_CLASS }__force-visible` ]: forceVisible,
		} );
		const scrollbarClipStyles = {
			marginRight: showVerticalScrollbar ? browserScrollbarPadding : '',
			marginBottom: showHorizontalScrollbar ? browserScrollbarPadding : '',
		};
		return (
			<div ref={ n => this.rootNode = n } className={ classes }>
				<div
					ref={ n => this.contentContainer = n }
					className={ `${ BASE_CLASS }__content-container` }
					onScroll={ this.contentScrollHandler }
					onClick={ this.contentUpdateHandler }
					onKeyDown={ this.contentUpdateHandler }
					style={ scrollbarClipStyles }
				>
					{ children }
				</div>
				{
					showVerticalScrollbar
					? <ScrollTrack
						direction="vertical"
						thumbSize={ verticalThumbSize }
						thumbOffset={ verticalThumbOffset }
					/>
					: null
				}
				{
					showHorizontalScrollbar
					? <ScrollTrack
						direction="horizontal"
						thumbSize={ horizontalThumbSize }
						thumbOffset={ horizontalThumbOffset }
					/>
					: null
				}
			</div>
		);
	}
}
