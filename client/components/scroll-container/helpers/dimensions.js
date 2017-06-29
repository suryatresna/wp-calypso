/**
 * External Dependencies
 */
import scrollbarWidth from 'scrollbar-width';

export const browserScrollbarWidth = typeof document === 'undefined' ? 0 : scrollbarWidth();

/**
 * Determine the size of the scroll thumb (draggable element of the scroll bar) given the
 * amount of visible space and total size of content along a dimension.  The direction the
 * user is allowed to scroll is also needed, due to the restricted amount of available space
 * for the thumb to traverse on the track if the user is allowed to scroll in both dimensions.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} totalSize - The total number of pixels that the content takes up
 * @returns {Number} The size of the thumb in pixels
 */
export function calcThumbSize( visibleSize, totalSize ) {
	return Math.min( Math.round( visibleSize / totalSize * visibleSize ), visibleSize );
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
 * @returns {Number} The offset of the thumb from the track base in pixels
 */
export function calcThumbOffset( visibleSize, totalSize, scrollAmount ) {
	const thumbSize = calcThumbSize( visibleSize, totalSize );
	const maxOffset = visibleSize - thumbSize;
	const proportionScrolled = scrollAmount / totalSize;
	return Math.min( Math.round( visibleSize * proportionScrolled ), maxOffset );
}
