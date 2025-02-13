import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Checkbox } from 'flowbite-react';
import { Table } from 'V2/Components/UI/Table';
import { Button } from 'V2/Components/UI/Button';

const TableStory = {
  title: 'Components/Table',
  component: Table,
};

const Template: ComponentStory<typeof Table> = args => (
  <div className="tw-content">
    <Table columns={args.columns} data={args.data} title={args.title} />
  </div>
);

const Basic = Template.bind({});
const WithActions = Template.bind({});

const checkboxCell = () => <Checkbox />;

const actionsCell = () => (
  <div className="flex gap-1">
    <Button>Primary</Button>
    <Button buttonStyle="secondary">Secondary</Button>
  </div>
);

Basic.args = {
  title: 'Table name',
  columns: [
    { id: 'select', Header: '', Cell: checkboxCell, disableSortBy: true },
    { Header: 'Title', accessor: 'title', id: 'title' },
    { Header: 'Description', accessor: 'description', disableSortBy: true },
    { Header: 'Date added', accessor: 'created', disableSortBy: true },
  ],
  data: [
    { title: 'Entity 2', created: 2, description: 'Short text' },
    {
      title: 'Entity 1',
      created: 1,
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
    },
    {
      title: 'Entity 3',
      created: 3,
      description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
    },
  ],
};

WithActions.args = {
  ...Basic.args,
  columns: [
    {
      id: 'select',
      Header: '',
      Cell: checkboxCell,
      disableSortBy: true,
    },
    { Header: 'Title', accessor: 'title', id: 'title', className: 'w-1/3' },
    {
      Header: 'Date added',
      accessor: 'created',
      disableSortBy: true,
      className: 'w-1/3',
    },
    {
      Header: 'Description',
      accessor: 'description',
      disableSortBy: true,
      className: 'w-1/3',
    },
    {
      id: 'action',
      Header: 'Actions',
      Cell: actionsCell,
      disableSortBy: true,
      className: 'text-center',
    },
  ],
};

export { Basic, WithActions };

export default TableStory as ComponentMeta<typeof Table>;
