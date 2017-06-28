/**
 * Internal dependencies
 */
import { getSiteOption, isJetpackSiteMainNetworkSite, isJetpackSiteSecondaryNetworkSite } from 'state/sites/selectors';
import { withoutHttp } from 'lib/url';

/**
 * Returns true if mainSiteId is the main site of  secondarySiteId and false otherwise
 * Returns null with the information available the relationship is unknown.
 *
 * @param  {Object}  state       Global state tree
 * @param  {Number}  mainSiteId      The ID of the main site
 * @param  {Number}  secondarySiteId      The ID of the main site
 * @return {?Boolean}            Whether mainSiteId is main site of secondarySiteId
 */
export default ( state, mainSiteId, secondarySiteId ) => {
	return isJetpackSiteMainNetworkSite( state, mainSiteId ) &&
		isJetpackSiteSecondaryNetworkSite( state, secondarySiteId ) &&
		withoutHttp( getSiteOption( state, mainSiteId, 'unmapped_url' ) ) ===
		withoutHttp( getSiteOption( state, secondarySiteId, 'main_network_site' ) );
};
