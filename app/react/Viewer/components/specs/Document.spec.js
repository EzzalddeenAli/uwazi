/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import PDF from 'app/PDF';
import { Document } from 'app/Viewer/components/Document.js';

describe('Document', () => {
  let component;
  let instance;

  let props;

  beforeEach(() => {
    props = {
      setSelection: jasmine.createSpy('setSelection'),
      PDFReady: jasmine.createSpy('PDFReady'),
      unsetSelection: jasmine.createSpy('unsetSelection'),
      onClick: jasmine.createSpy('onClick'),
      doc: Immutable.fromJS({ _id: 'documentId', documents: [{ pdfInfo: { test: 'pdfInfo' } }] }),
      file: { language: 'eng', _id: 'fileId', pdfInfo: { test: 'pdfInfo' } },
      onDocumentReady: jasmine.createSpy('onDocumentReady'),
      selectedSnippet: Immutable.fromJS({}),
      docHTML: Immutable.fromJS({
        pages: ['page1', 'page2', 'page3'],
        css: 'css',
      }),
      references: Immutable.fromJS([{ reference: 'reference' }]),
    };
  });

  const render = () => {
    component = shallow(<Document {...props} />);
    instance = component.instance();
  };

  it('should add id as a className', () => {
    render();
    expect(
      component
        .find('div')
        .children()
        .first()
        .hasClass('_documentId')
    ).toBe(true);
  });

  it('should add the className passed', () => {
    props.className = 'aClass';
    render();
    expect(
      component
        .find('div')
        .children()
        .first()
        .hasClass('aClass')
    ).toBe(true);
  });

  it('should add the correct LTR or RTL direction according to file franc language', () => {
    render();
    expect(component.find('.document').hasClass('force-ltr')).toBe(true);

    props.file.language = 'arb';
    render();
    expect(component.find('.document').hasClass('force-rtl')).toBe(true);
  });

  describe('onClick', () => {
    describe('when executeOnClickHandler = true', () => {
      it('should execute onClick', () => {
        props.executeOnClickHandler = true;
        render();
        component.find('.pages').simulate('click', { target: {} });

        expect(props.onClick).toHaveBeenCalled();
      });
    });

    describe('when executeOnClickHandler = false', () => {
      it('should not execute onClick', () => {
        props.executeOnClickHandler = false;
        render();
        component.find('.pages').simulate('click', { target: {} });

        expect(props.onClick).not.toHaveBeenCalled();
      });
    });

    describe('when the target is a reference', () => {
      beforeEach(() => {
        props.references = Immutable.fromJS([{ reference: 'reference' }]);
      });

      it('should activate the reference', () => {
        props.executeOnClickHandler = true;
        props.references = Immutable.fromJS([{ _id: 'referenceId', test: 'test' }]);
        props.activateReference = jasmine.createSpy('activateReference');
        render();
        instance.text = { selected: jasmine.createSpy('selected').and.returnValue(false) };
        component.find('.pages').simulate('click', {
          target: { className: 'reference', getAttribute: () => 'referenceId' },
        });
        expect(props.activateReference).toHaveBeenCalledWith(
          props.references.get(0).toJS(),
          props.file.pdfInfo,
          props.references.toJS()
        );
        expect(props.onClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('when PDF is ready', () => {
    it('should call the onDocumentReady prop with the doc as argument', () => {
      render();
      const pdf = component.find(PDF).first();
      pdf.simulate('PDFReady');
      expect(props.onDocumentReady).toHaveBeenCalledWith(props.doc);
    });
  });

  describe('when document changes', () => {
    it('should unset selection', () => {
      render();
      instance.text = {
        selected: jasmine.createSpy('selected'),
        renderReferences: jasmine.createSpy('renderReferences'),
        simulateSelection: jasmine.createSpy('simulateSelection'),
        activate: jasmine.createSpy('activate'),
      };
      expect(props.unsetSelection.calls.count()).toBe(1);

      component.setProps({
        doc: Immutable.fromJS({ _id: 'documentId' }),
        selectedSnippet: Immutable.fromJS({}),
      });

      expect(props.unsetSelection.calls.count()).toBe(1);
      component.setProps({
        doc: Immutable.fromJS({ _id: 'anotherId' }),
        selectedSnippet: Immutable.fromJS({}),
      });
      expect(props.unsetSelection.calls.count()).toBe(2);
    });
  });

  describe('componentDidMount', () => {
    it('should unset selection', () => {
      render();
      expect(props.unsetSelection.calls.count()).toBe(1);
      instance.componentDidMount();
      expect(props.unsetSelection.calls.count()).toBe(2);
    });
  });
});
