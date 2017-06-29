/**
 * External Dependencies
 */
import scrollbarWidth from 'scrollbar-width';

export const browserScrollbarWidth = typeof document === 'undefined' ? 0 : scrollbarWidth();

/**
 * Determine the size of the scroll puck (draggable element of the scroll bar) given the
 * amount of visible space and total size of content along a dimension.  The direction the
 * user is allowed to scroll is also needed, due to the restricted amount of available space
 * for the puck to traverse on the track if the user is allowed to scroll in both dimensions.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} totalSize - The total number of pixels that the content takes up
 * @param {Number} trackMargin - The amount of space between the track and the edge of the scrollable area
 * @returns {Number} The size of the puck in pixels
 */
export function calcPuckSize( visibleSize, totalSize, trackMargin ) {
	return Math.min( Math.round( ( visibleSize - ( trackMargin * 2 ) ) / totalSize * visibleSize ), visibleSize );
}

/**
 * Determine the pixel offset of the puck from the base of the track given how much the
 * user has scrolled.  The direction the user is allowed to scroll is also needed, due to
 * the restricted amount of available space for the puck to traverse on the track if the
 * user is allowed to scroll in both dimensions.
 *
 * @private
 * @param {Number} visibleSize - The number of visible pixels in the direction you care about
 * @param {Number} totalSize - The total number of pixels that the content takes up
 * @param {Number} scrollAmount - The number of pixels the user has scrolled in a given dimension
 * @param {Number} trackMargin - The amount of space between the track and the edge of the scrollable area
 * @returns {Number} The offset of the puck from the track base in pixels
 */
export function calcPuckOffset( visibleSize, totalSize, scrollAmount, trackMargin ) {
	const puckSize = calcPuckSize( visibleSize, totalSize, trackMargin );
	const maxOffset = visibleSize - puckSize - ( trackMargin * 2 );
	const proportionScrolled = scrollAmount / totalSize;
	return Math.max( Math.min( Math.round( visibleSize * proportionScrolled ), maxOffset ), trackMargin );
}
