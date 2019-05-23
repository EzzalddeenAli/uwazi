import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { MetadataFormFields } from 'app/Metadata';
import { LocalForm, actions, Control } from 'react-redux-form';
import Tip from 'app/Layout/Tip';
import { Captcha } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { publicSubmit } from 'app/Uploads/actions/uploadsActions';
import { bindActionCreators } from 'redux';

export class PublicForm extends Component {
  static renderFile() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor="file"><Translate>File</Translate></label>
          </li>
          <li className="wide">
            <Control.file id="file" className="form-control" model=".file" accept=".pdf" />
          </li>
        </ul>
      </div>
    );
  }

  static renderAttachments() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor="file">
              <Translate>Attachments</Translate>
              <Tip><Translate>You can select more than one file at once.</Translate></Tip>
            </label>
          </li>
          <li className="wide">
            <Control.file id="file" className="form-control" multiple="multiple" model=".attachments" />
          </li>
        </ul>
      </div>
    );
  }

  static renderTitle() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          <li>
            <label htmlFor="text"><Translate>Title</Translate></label>
          </li>
          <li className="wide">
            <Control.text id="text" className="form-control" model=".title" />
          </li>
        </ul>
      </div>
    );
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  handleSubmit(_values) {
    const values = { ..._values };
    const { submit } = this.props;
    values.file = _values.file ? _values.file[0] : undefined;
    submit(values);
    this.refreshCaptcha();
    this.formDispatch(actions.reset('publicform'));
  }

  renderCaptcha() {
    return (
      <ul className="search__filter">
        <li><label><Translate>Are you a robot?</Translate><span className="required">*</span></label></li>
        <li className="wide">
          <Captcha refresh={(refresh) => { this.refreshCaptcha = refresh; }} model=".captcha"/>
        </li>
      </ul>
    );
  }

  render() {
    const { properties, thesauris, file, attachments } = this.props;
    const model = '';
    return (
      <LocalForm model="publicform" initialState={{ file: '', attachments: '' }} getDispatch={dispatch => this.attachDispatch(dispatch)} onSubmit={values => this.handleSubmit(values)}>
        {PublicForm.renderTitle()}
        <MetadataFormFields thesauris={thesauris} model={model} template={properties} />
        {file ? PublicForm.renderFile() : false}
        {attachments ? PublicForm.renderAttachments() : false}
        {this.renderCaptcha()}
        <input type="submit" className="btn btn-success" value="Submit"/>
      </LocalForm>
    );
  }
}

PublicForm.defaultProps = {
  file: false,
  attachments: false,
};

PublicForm.propTypes = {
  file: PropTypes.bool,
  attachments: PropTypes.bool,
  properties: PropTypes.instanceOf(Immutable.Map).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  submit: PropTypes.func.isRequired,
};

export const mapStateToProps = (state, props) => ({
  properties: state.templates.find(template => template.get('_id') === props.template),
  thesauris: state.thesauris,
  file: Boolean(props.file),
  attachments: Boolean(props.attachments),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submit: publicSubmit }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicForm);
