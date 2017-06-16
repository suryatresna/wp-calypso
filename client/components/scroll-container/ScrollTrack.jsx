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
		const { className, direction, thumbOffset, thumbSize } = this.props;
		const isVertical = direction === 'vertical';
		const isHorizontal = direction === 'horizontal';
		const thumbStyles = {
			height: isVertical ? `${ thumbSize }px` : '',
			left: isHorizontal ? `${ thumbOffset }px` : '',
			top: isVertical ? `${ thumbOffset }px` : '',
			width: isHorizontal ? `${ thumbSize }px` : '',
		};
		const trackClasses = classnames( `${ BASE_CLASS }__track ${ BASE_CLASS }__track-${ direction }`, className );
		return (
			<div ref={ this.props.refFn } className={ trackClasses }>
				<div
					className={ `${ BASE_CLASS }__thumb ${ BASE_CLASS }__thumb-${ direction }` }
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
	thumbOffset: PropTypes.number.isRequired,
	thumbSize: PropTypes.number.isRequired,
};
