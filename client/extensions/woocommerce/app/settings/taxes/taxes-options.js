/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import ExtendedHeader from 'woocommerce/components/extended-header';
import FormCheckbox from 'components/forms/form-checkbox';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';

class TaxesOptions extends Component {

	static propTypes = {
		onCheckboxChange: PropTypes.func.isRequired,
		pricesIncludeTaxes: PropTypes.bool.isRequired,
		shippingIsTaxable: PropTypes.bool.isRequired,
	};

	render = () => {
		const { onCheckboxChange, pricesIncludeTaxes, shippingIsTaxable, translate } = this.props;

		return (
			<div className="taxes__taxes-options">
				<ExtendedHeader
					label={ translate( 'Tax settings' ) }
					description={ translate( 'Configure how taxes are calculated' ) }
				/>
				<Card>
					<FormFieldset>
						<FormLabel>
							<FormCheckbox checked={ pricesIncludeTaxes } name="pricesIncludeTaxes" onChange={ onCheckboxChange } />
								<span>{ translate( 'Taxes are included in product prices' ) }</span>
						</FormLabel>
					</FormFieldset>
					<FormFieldset>
						<FormLabel>
							<FormCheckbox checked={ shippingIsTaxable } name="shippingIsTaxable" onChange={ onCheckboxChange } />
								<span>{ translate( 'Charge taxes on shipping costs' ) }</span>
						</FormLabel>
					</FormFieldset>
				</Card>
			</div>
		);
	}
}

export default localize( TaxesOptions );
