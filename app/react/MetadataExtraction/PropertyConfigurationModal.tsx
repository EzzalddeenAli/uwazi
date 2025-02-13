import React, { useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { TemplateSchema } from 'shared/types/templateType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import Icons from 'app/Templates/components/Icons';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

export interface IXTemplateConfiguration {
  template: ObjectIdSchema;
  properties: string[];
}

export interface PropertyConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (properties: IXTemplateConfiguration[]) => void;
  templates: TemplateSchema[];
  currentProperties: IXTemplateConfiguration[];
}

export const PropertyConfigurationModal = ({
  isOpen,
  onClose,
  onAccept,
  templates,
  currentProperties,
}: PropertyConfigurationModalProps) => {
  const currentValues = currentProperties.reduce((result: string[], config) => {
    const { template, properties } = config;
    const props = properties.map(prop => `${template}-${prop}`);
    return result.concat(props);
  }, []);

  const [values, setValues] = useState(currentValues);
  const options = templates.map(template => ({
    label: template.name,
    id: template._id,
    value: template._id,
    options: template.properties
      ?.map(prop => ({
        label: prop.label,
        value: `${template._id?.toString()}-${prop.name}`,
        type: prop.type,
        icon: { type: 'Icons', _id: Icons[prop.type] },
      }))
      .filter(p => SUPPORTED_PROPERTIES.includes(p.type))
      .concat([
        {
          label: 'Title',
          value: `${template._id?.toString()}-title`,
          type: 'text',
          icon: { type: 'Icons', _id: Icons.text },
        },
      ]),
  }));

  const handleSubmit = (submitedValues: string[]) => {
    const processedValues = submitedValues.reduce((result: IXTemplateConfiguration[], value) => {
      const [templateName, propertyName] = value.split('-');
      const template = templates.find(t => t._id === templateName);

      if (!template) {
        return result;
      }

      const templateConfig = result.find(c => c.template === template._id);
      if (templateConfig) {
        templateConfig.properties.push(propertyName);
        return result;
      }

      return result.concat({ template: template._id!.toString(), properties: [propertyName] });
    }, []);

    onAccept(processedValues);
  };

  return (
    <Modal isOpen={isOpen} type="content" className="suggestion-acceptance-modal">
      <Modal.Header>
        <h1>
          <Translate>Add properties</Translate>
          <span>*</span>
        </h1>
      </Modal.Header>
      <Modal.Body>
        <MultiSelect
          value={values}
          onChange={setValues}
          options={options}
          optionsToShow={20}
          showSearch
        />
      </Modal.Body>
      <Modal.Footer>
        <span className="left">
          *<Translate>Only text, number and date properties are currently supported</Translate>
        </span>
        <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
          <Translate>Cancel</Translate>
        </button>
        <button
          type="button"
          className="btn confirm-button btn-success"
          onClick={() => handleSubmit(values)}
        >
          <Translate>Save</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};
