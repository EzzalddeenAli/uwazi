import React from 'react';
import { Provider } from 'react-redux';
import { mount } from '@cypress/react18';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { SearchMultiselect } from '../SearchMultiSelect';

describe('SearchMultiSelect.cy.tsx', () => {
  const pizzas = [
    { label: 'Margherita', value: 'MGT' },
    { label: 'Pepperoni', value: 'PPR' },
    { label: 'Hawaiian', value: 'HWN' },
    { label: 'Vegetarian', value: 'VGT' },
    { label: 'Meat Lovers', value: 'MLV' },
    { label: 'BBQ Chicken', value: 'BQC' },
    { label: 'Mushroom', value: 'MSH' },
    { label: 'Four Cheese', value: 'FC' },
    { label: 'Buffalo Chicken', value: 'BFC' },
    { label: 'Chicken Bacon Ranch', value: 'CBR' },
    { label: 'Chicken Alfredo', value: 'CAF' },
  ];
  let selected: string[] = [];

  beforeEach(() => {
    cy.viewport(450, 650);
    mount(
      <Provider store={createStore()}>
        <div className="tw-content p-2">
          <SearchMultiselect
            items={pizzas}
            onChange={selectedItems => {
              selected = selectedItems;
            }}
          />
        </div>
      </Provider>
    );
  });

  it('should render the list of options', () => {
    pizzas.forEach(({ label }) => {
      cy.contains(label).should('be.visible');
    });
  });

  it('should filter the list of options', () => {
    cy.get('input').type('chicken');
    cy.contains('BBQ Chicken').should('be.visible');
    cy.contains('Buffalo Chicken').should('be.visible');
    cy.contains('Chicken Bacon Ranch').should('be.visible');
    cy.contains('Chicken Alfredo').should('be.visible');
    cy.contains('Margherita').should('not.be.visible');
  });

  it('should select options', () => {
    cy.get('input').type('chicken');
    cy.contains('BBQ Chicken').click();

    cy.get('[data-testid="clear-field-button"]').click();
    cy.get('input').type('margherita');
    cy.contains('Margherita').click();

    cy.get('[data-testid="clear-field-button"]').click();
    cy.contains('span', 'BBQ Chicken').siblings().contains('Selected');
    cy.contains('span', 'Margherita').siblings().contains('Selected');
    cy.get('ul').then(() => {
      expect(selected).to.deep.equal(['BQC', 'MGT']);
    });
  });
});
