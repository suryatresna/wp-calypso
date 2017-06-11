/**
 * External Dependencies
 */
import React, { PropTypes } from 'react';

/**
 * Internal Dependencies
 */
import { BASE_CLASS } from './constants';

export default function ScrollTrack( { direction, thumbOffset, thumbSize } ) {
	const isVertical = direction === 'vertical';
	const isHorizontal = direction === 'horizontal';
	const thumbStyles = {
		height: isVertical ? `${ thumbSize }px` : '',
		left: isHorizontal ? `${ thumbOffset }px` : '',
		top: isVertical ? `${ thumbOffset }px` : '',
		width: isHorizontal ? `${ thumbSize }px` : '',
	};
	return (
		<div className={ `${ BASE_CLASS }__track ${ BASE_CLASS }__track-${ direction }` }>
			<div
				className={ `${ BASE_CLASS }__thumb ${ BASE_CLASS }__thumb-${ direction }` }
				style={ thumbStyles }
			/>
		</div>
	);
}

ScrollTrack.propTypes = {
	direction: PropTypes.oneOf( [ 'vertical', 'horizontal' ] ),
	thumbOffset: PropTypes.number.isRequired,
	thumbSize: PropTypes.number.isRequired,
};
