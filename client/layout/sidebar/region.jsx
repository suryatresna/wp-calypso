/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal Dependencies
 */
import ScrollContainer from 'components/scroll-container';

const SidebarRegion = ( { children, className } ) => (
	<ScrollContainer direction="vertical" autoHide>
		<div className={ classNames( 'sidebar__region', className ) }>
			{ children }
		</div>
	</ScrollContainer>
);

export default SidebarRegion;
