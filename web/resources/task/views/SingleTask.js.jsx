/* eslint-disable no-alert */
/* eslint-disable no-nested-ternary */
/* eslint-disable operator-linebreak */
/* eslint-disable no-shadow */
/* eslint-disable no-undef */
/* eslint-disable linebreak-style */
/**
 * View component for /tasks/:taskId
 *
 * Displays a single task from the 'byId' map in the task reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as taskActions from '../taskActions';
import * as noteActions from '../../note/noteActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import TaskLayout from '../components/TaskLayout.js.jsx';
import NoteForm from '../../note/components/NoteForm.js.jsx';

class SingleTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      showNoteForm: false 
      , note: _.cloneDeep(this.props.defaultNote.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , noteFormHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the note
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleNoteSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(taskActions.fetchSingleIfNeeded(match.params.taskId));
    dispatch(noteActions.fetchDefaultNote());
    dispatch(noteActions.fetchListIfNeeded('_task', match.params.taskId));
  }


  componentWillReceiveProps(nextProps) {
    const { dispatch, match } = this.props;
    dispatch(noteActions.fetchListIfNeeded('_task', match.params.taskId));
    this.setState({
      note: _.cloneDeep(nextProps.defaultNote.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleNoteSubmit(e) {
    e.preventDefault();
    const { defaultNote, dispatch, match } = this.props;
    let newNote = {...this.state.note}
    newNote._task = match.params.taskId;

    dispatch(noteActions.sendCreateNote(newNote)).then(noteRes => {
      if(noteRes.success) {
        dispatch(noteActions.invalidateList('_task', match.params.taskId));
        this.setState({
          showNoteForm: false
          , note: _.cloneDeep(defaultNote.obj)
        })
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { showNoteForm, note, formHelpers } = this.state;
    const { 
      defaultNote      
      , taskStore
      , match
      , noteStore 
    } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual task object from the map
     */
    const selectedTask = taskStore.selected.getItem();


    // get the noteList meta info here so we can reference 'isFetching'
    const noteList = noteStore.lists && noteStore.lists._task ? noteStore.lists._task[match.params.taskId] : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual note objetcs
     */
    const noteListItems = noteStore.util.getList("_task", match.params.taskId);
    
    const isTaskEmpty = (
      !selectedTask
      || !selectedTask._id
      || taskStore.selected.didInvalidate
    );

    const isTaskFetching = (
      taskStore.selected.isFetching
    )

    const isNoteListEmpty = (
      !noteListItems
      || !noteList
    );

    const isNoteListFetching = (
      !noteListItems
      || !noteList
      || noteList.isFetching
    )


    const isNewNoteEmpty = !note;

    return (
      <TaskLayout>
        <h3> Single Task </h3>
        { isTaskEmpty ?
          (isTaskFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isTaskFetching ? 0.5 : 1 }}>
            <h1> { selectedTask.name }
            </h1>
            <p> { selectedTask.description }</p>
            <Link className="yt-btn x-small bordered" to={`${this.props.match.url}/update`}> Edit </Link>
            <hr/>
            { isNoteListEmpty ?
              (isNoteListFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
              :
              <div style={{ opacity: isNoteListFetching ? 0.5 : 1 }}>
                <ul>
                  {noteListItems.map((note, i) =>
                    <li key={note._id + i}>
                      <h3>{note.name}</h3>
                      <p>{note.description}</p>
                      <Link className="yt-btn x-small bordered" to={`/notes/${note._id}`}> Comments </Link>
                      
                    </li>
                  )}
                </ul>
              </div>
            }
            { !isNewNoteEmpty && showNoteForm ?
              <div>
                <NoteForm
                  note={note}
                  cancelLink=""
                  cancelAction={() => this.setState({showNoteForm: false, note: _.cloneDeep(defaultNote.obj)})}
                  formHelpers={formHelpers}
                  formTitle="Your Comment"
                  formType="create"
                  handleFormChange={this._handleFormChange}
                  handleFormSubmit={this._handleNoteSubmit}
                />
              </div>
              : 
              <div>
                <br></br>
                <button className="yt-btn" style={{marginTop: 10}} onClick={() => this.setState({showNoteForm: true})}>Comment</button>
           
              </div> }
          </div>
        }
      </TaskLayout>
    )
  }
}

SingleTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultNote: store.note.defaultItem
    , taskStore: store.task
    , noteStore: store.note
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleTask)
);
