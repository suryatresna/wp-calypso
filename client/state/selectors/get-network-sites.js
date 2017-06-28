/**
 * Internal dependencies
 */
import createSelector from 'lib/create-selector';
import { getSites, isMainSiteToSecondarySiteConnection } from 'state/selectors';

/**
 * Returns the secondary sites of a given site
 *
 * @param  {Object}  state       Global state tree
 * @param  {Number}  siteId      The ID of the site we're retrieving secondary sites
 * @return {?Array}            Array of secondary sites
 */
export default createSelector(
	( state, siteId ) => {
		return getSites( state ).filter( ( secondarySite ) => isMainSiteToSecondarySiteConnection( state, siteId, secondarySite.ID ) );
	},
	( state ) => state.sites.items
);
