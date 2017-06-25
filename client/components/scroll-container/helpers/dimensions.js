/**
 * External Dependencies
 */
import scrollbarWidth from 'scrollbar-width';

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
