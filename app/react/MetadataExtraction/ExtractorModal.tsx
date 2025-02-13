import React, { useEffect, useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { TemplateSchema } from 'shared/types/templateType';
import Icons from 'app/Templates/components/Icons';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

export interface IXExtractorInfo {
  _id?: string;
  name: string;
  property: string;
  templates: string[];
}

export interface ExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: TemplateSchema[];
  extractor?: IXExtractorInfo;
}

export const ExtractorModal = ({
  isOpen,
  onClose,
  onAccept,
  templates,
  extractor,
}: ExtractorModalProps) => {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [isEditing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    if (extractor) {
      setEditing(true);
      setName(extractor.name);
      const initialValues = extractor.templates.map(
        template => template + '-' + extractor.property
      );
      setValues(initialValues);
    } else {
      setEditing(false);
    }
  }, [extractor]);

  const filter = values.length ? values[0].split('-', 2)[1] : null;
  const options = templates.map(template => ({
    label: template.name,
    id: template._id,
    value: template._id,
    options: template.properties
      ?.filter(prop => !filter || prop.name === filter)
      .map(prop => ({
        label: prop.label,
        value: `${template._id?.toString()}-${prop.name}`,
        type: prop.type,
        icon: { type: 'Icons', _id: Icons[prop.type] },
      }))
      .filter(p => SUPPORTED_PROPERTIES.includes(p.type))
      .concat(
        !filter || filter === 'title'
          ? [
              {
                label: 'Title',
                value: `${template._id?.toString()}-title`,
                type: 'text',
                icon: { type: 'Icons', _id: Icons.text },
              },
            ]
          : []
      ),
  }));

  const handleSubmit = (submittedName: string, submitedValues: string[]) => {
    setEditing(false);
    const result: null | IXExtractorInfo = submitedValues.length
      ? {
          _id: undefined,
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: submitedValues.map(value => value.split('-', 2)[0]),
        }
      : null;

    if (isEditing && result && extractor) {
      result._id = extractor._id;
    }

    if (result === null) {
      onClose();
    } else {
      onAccept(result);
    }
  };

  const handleClose = () => {
    setEditing(false);
    setName('');
    setValues([]);
    onClose();
  };

  const onAllTemplatedCheckboxChanged = () => {
    const templatesIds = templates.map(template => template._id);
    const properties = new Set();
    values.forEach(value => {
      properties.add(value.split('-')[1]);
    });
    const newValues: string[] = [];
    templatesIds.forEach(template => {
      const arrProps = Array.from(properties);
      arrProps.forEach(prop => {
        newValues.push(template + '-' + prop);
      });
    });
    console.log(newValues);
    setValues(newValues);
  };

  return (
    <Modal isOpen={isOpen} type="content" className="extractor-creation-modal">
      <Modal.Header>
        <div className="extractor-label">
          {isEditing ? (
            <Translate>Edit Extractor</Translate>
          ) : (
            <Translate>Create Extractor</Translate>
          )}
        </div>
        <div className="all-templates-button">
          <button className="btn" onClick={onAllTemplatedCheckboxChanged}>
            <Translate>From all templates</Translate>
          </button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <input
          value={name}
          type="text"
          className="form-control extractor-name-input"
          onChange={event => setName(event.target.value)}
          placeholder="Extractor name"
        />
        <div className="property-selection">
          <MultiSelect
            className="ix-extraction-multiselect"
            value={values}
            onChange={setValues}
            options={options}
            optionsToShow={20}
            topLevelSelectable={false}
          />
        </div>
        <span className="left">
          * <Translate>Only text, number and date properties are currently supported</Translate>
        </span>
      </Modal.Body>
      <Modal.Footer>
        <div className="extractor-footer">
          <button
            type="button"
            className="btn btn-default btn-extra-padding action-button"
            onClick={handleClose}
          >
            <Translate>Cancel</Translate>
          </button>
          <button
            type="button"
            className="btn btn-default action-button btn-extra-padding"
            onClick={() => handleSubmit(name, values)}
          >
            {isEditing ? <Translate>Save</Translate> : <Translate>Add</Translate>}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export interface ExtractorModalStateType {
  configurationModalIsOpen: boolean;
  extractorModelIsOpen: boolean;
}
