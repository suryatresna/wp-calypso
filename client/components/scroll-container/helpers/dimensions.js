/**
 * External Dependencies
 */
import scrollbarWidth from 'scrollbar-width';

/**
 * Internal Dependencies
 */
import { LOCK_SCROLL_CLASS } from '../constants';

export const browserScrollbarWidth = typeof document === 'undefined' ? 0 : scrollbarWidth();

/**
 * Determine the size of the scroll track given the amount of visible space.  If we're scrolling
 * in both dimensions, the track has to be a bit shorter to prevent overlap of the two tracks.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} scrollDirection - The direction in which the user is allowed to scroll
 * @returns {Number} The size of the scroll track in pixels
 */
export function calcTrackSize( visibleSize, scrollDirection ) {
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
export function calcThumbSize( visibleSize, totalSize, scrollDirection ) {
	const visibleSpace = calcTrackSize( visibleSize, scrollDirection );
	return Math.min( Math.round( visibleSize / totalSize * visibleSpace ), visibleSpace );
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
export function calcThumbOffset( visibleSize, totalSize, scrollAmount, scrollDirection ) {
	const thumbSize = calcThumbSize( visibleSize, totalSize, scrollDirection );
	const trackSize = calcTrackSize( visibleSize, totalSize, scrollDirection );
	const maxOffset = trackSize - thumbSize;
	const proportionScrolled = scrollAmount / totalSize;
	return Math.min( Math.round( trackSize * proportionScrolled ), maxOffset );
}

/**
 * Prevent the body from scrolling.  Currently unused due to display issues...
 *
 * @export
 */
export function lockBodyScroll() {
	if (
		typeof document !== undefined &&
		document.body != null &&
		! document.body.classList.contains( LOCK_SCROLL_CLASS )
	) {
		const body = document.body;
		const bodyStyles = window.getComputedStyle( body );
		const rightPadding = `${ browserScrollbarWidth }px`;
		const widthWithoutPadding = `calc(100vw - ${ browserScrollbarWidth }px)`;
		body.classList.add( LOCK_SCROLL_CLASS );
		if ( bodyStyles.boxSizing !== 'border-box' ) {
			body.style.width = widthWithoutPadding;
		}
		body.style.paddingRight = rightPadding;
		const masterbar = body.getElementsByClassName( 'masterbar' );
		if ( masterbar.length > 0 ) {
			masterbar[ 0 ].style.paddingRight = rightPadding;
			const masterbarStyles = window.getComputedStyle( masterbar[ 0 ] );
			if ( masterbarStyles.boxSizing !== 'border-box' ) {
				masterbar[ 0 ].style.width = widthWithoutPadding;
			}
		}
	}
}

/**
 * Allow the body to scroll again.  Currently unused due to display issues...
 *
 * @export
 */
export function unlockBodyScroll() {
	if (
		typeof document !== undefined &&
		document.body != null &&
		document.body.classList.contains( LOCK_SCROLL_CLASS )
	) {
		const body = document.body;
		body.classList.remove( LOCK_SCROLL_CLASS );
		body.style.paddingRight = '';
		body.style.width = '';
		const masterbar = body.getElementsByClassName( 'masterbar' );
		if ( masterbar.length > 0 ) {
			masterbar[ 0 ].style.paddingRight = '';
			masterbar[ 0 ].style.width = '';
		}
	}
}
