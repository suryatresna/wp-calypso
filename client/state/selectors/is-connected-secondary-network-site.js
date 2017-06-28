/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import createSelector from 'lib/create-selector';
import { isMainSiteToSecondarySiteConnection } from 'state/selectors';

/**
 * Returns true if site with id siteId a connected secondary site and false otherwise
 *
 * @param  {Object}  state       Global state tree
 * @param  {Number}  siteId      The ID of the site we're querying
 * @return {?Boolean}            Whether site with id siteId a connected secondary site
 */
export default createSelector(
	( state, siteId ) => {
		const siteIds = Object.keys( get( state, 'sites.items', {} ) );
		return siteIds.some( mainSiteId => isMainSiteToSecondarySiteConnection( state, mainSiteId, siteId ) );
	},
	( state ) => state.sites.items
);
