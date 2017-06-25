/**
 * External Dependencies
 */
import React, { PropTypes, PureComponent } from 'react';
import classnames from 'classnames';

/**
 * Internal Dependencies
 */
import { BASE_CLASS } from './constants';

export default class ScrollTrack extends PureComponent {
	render() {
		const { className, direction, thumbHovered, thumbOffset, thumbSize, trackHovered } = this.props;
		const isVertical = direction === 'vertical';
		const isHorizontal = direction === 'horizontal';
		const hoverClass = `${ BASE_CLASS }-is-hovered`;
		const thumbStyles = {
			height: isVertical ? `${ thumbSize }px` : null,
			left: isHorizontal ? `${ thumbOffset }px` : null,
			top: isVertical ? `${ thumbOffset }px` : null,
			width: isHorizontal ? `${ thumbSize }px` : null,
		};
		const trackClasses = classnames( `${ BASE_CLASS }__track ${ BASE_CLASS }__track-${ direction }`, className, {
			[ hoverClass ]: trackHovered,
		} );
		const thumbClasses = classnames( `${ BASE_CLASS }__thumb ${ BASE_CLASS }__thumb-${ direction }`, {
			[ hoverClass ]: thumbHovered,
		} );
		return (
			<div ref={ this.props.refFn } className={ trackClasses }>
				<div
					className={ thumbClasses }
					style={ thumbStyles }
				/>
			</div>
		);
	}
}

ScrollTrack.propTypes = {
	className: PropTypes.string,
	direction: PropTypes.oneOf( [ 'vertical', 'horizontal' ] ),
	refFn: PropTypes.func,
	thumbHovered: PropTypes.bool,
	thumbOffset: PropTypes.number.isRequired,
	thumbSize: PropTypes.number.isRequired,
	trackHovered: PropTypes.bool,
};

ScrollTrack.defaultProps = {
	thumbHovered: false,
	trackHovered: false,
};
