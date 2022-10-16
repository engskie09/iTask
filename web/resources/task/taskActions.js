/**
 * All Task CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import apiUtils from '../../global/utils/api'

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.task;
  if(selected.id !== id) {
    // the "selected" id changed, so we _should_ fetch
    // console.log("Y shouldFetch - true: id changed");
    return true;
  } else if(selected.isFetching) {
    // "selected" is already fetching, don't do anything
    // console.log("Y shouldFetch - false: isFetching");
    return false;
  } else if(!byId[id] && !selected.error) {
    // the id is not in the map, fetch from server
    // however, if the api returned an error, then it SHOULDN'T be in the map
    // so re-fetching it will result in an infinite loop
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(new Date().getTime() - selected.lastUpdated > (1000 * 60 * 5)) {
    // it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    // also, don't automatically invalidate on server error. if server throws an error,
    // that won't change on subsequent requests and we will have an infinite loop
    return true;
  } else {
    // if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return selected.didInvalidate;
  }
}

export const INVALIDATE_SELECTED_TASK = "INVALIDATE_SELECTED_TASK"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_TASK
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleTaskById(id))
  } else {
    return dispatch(returnSingleTaskPromise(id)); // return promise that contains task
  }
}

export const returnSingleTaskPromise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. this is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve, reject) => {
    resolve({
      type: "RETURN_SINGLE_TASK_WITHOUT_FETCHING"
      , id: id
      , item: getState().task.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_TASK = "REQUEST_SINGLE_TASK";
function requestSingleTask(id) {
  return {
    type: REQUEST_SINGLE_TASK
    , id
  }
}

export const RECEIVE_SINGLE_TASK = "RECEIVE_SINGLE_TASK";
function receiveSingleTask(json) {
  return {
    type: RECEIVE_SINGLE_TASK
    , id: json.task ? json.task._id : null
    , item: json.task
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingleTaskById(taskId) {
  return dispatch => {
    dispatch(requestSingleTask(taskId))
    return apiUtils.callAPI(`/api/tasks/${taskId}`)
      .then(json => dispatch(receiveSingleTask(json)))
  }
}

export const ADD_SINGLE_TASK_TO_MAP = "ADD_SINGLE_TASK_TO_MAP";
export function addSingleTaskToMap(item) {
  return {
    type: ADD_SINGLE_TASK_TO_MAP
    , item
  }
}

export const SET_SELECTED_TASK = "SET_SELECTED_TASK";
export function setSelectedTask(item) {
  return {
    type: SET_SELECTED_TASK
    , item
  }
}


export const REQUEST_DEFAULT_TASK = "REQUEST_DEFAULT_TASK";
function requestDefaultTask(id) {
  return {
    type: REQUEST_DEFAULT_TASK
  }
}

export const RECEIVE_DEFAULT_TASK = "RECEIVE_DEFAULT_TASK";
function receiveDefaultTask(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_TASK
  }
}

export function fetchDefaultTask() {
  return dispatch => {
    dispatch(requestDefaultTask())
    return apiUtils.callAPI(`/api/tasks/default`)
      .then(json => dispatch(receiveDefaultTask(json)))
  }
}


export const REQUESTTASK_SCHEMA = "REQUESTTASK_SCHEMA";
function requestTaskSchema(id) {
  return {
    type: REQUESTTASK_SCHEMA
  }
}

export const RECEIVETASK_SCHEMA = "RECEIVETASK_SCHEMA";
function receiveTaskSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVETASK_SCHEMA
  }
}

export function fetchTaskSchema() {
  return dispatch => {
    dispatch(requestTaskSchema())
    return apiUtils.callAPI(`/api/tasks/schema`)
      .then(json => dispatch(receiveTaskSchema(json)))
  }
}


export const REQUEST_CREATE_TASK = "REQUEST_CREATE_TASK";
function requestCreateTask(task) {
  return {
    type: REQUEST_CREATE_TASK
    , task
  }
}

export const RECEIVE_CREATE_TASK = "RECEIVE_CREATE_TASK";
function receiveCreateTask(json) {
  return {
    type: RECEIVE_CREATE_TASK
    , id: json.task ? json.task._id : null
    , item: json.task
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateTask(data) {
  return dispatch => {
    dispatch(requestCreateTask(data))
    return apiUtils.callAPI('/api/tasks', 'POST', data)
      .then(json => dispatch(receiveCreateTask(json)))
  }
}

export const REQUEST_UPDATE_TASK = "REQUEST_UPDATE_TASK";
function requestUpdateTask(task) {
  return {
    id: task ? task._id : null
    , task
    , type: REQUEST_UPDATE_TASK
  }
}

export const RECEIVE_UPDATE_TASK = "RECEIVE_UPDATE_TASK";
function receiveUpdateTask(json) {
  return {
    type: RECEIVE_UPDATE_TASK
    , id: json.task ? json.task._id : null
    , item: json.task
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdateTask(data) {
  return dispatch => {
    dispatch(requestUpdateTask(data))
    return apiUtils.callAPI(`/api/tasks/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateTask(json)))
  }
}

export function sendUpdateTaskComplete(data) {
  return dispatch => {
    dispatch(requestUpdateTask(data))
    return apiUtils.callAPI(`/api/tasks/${data._id}/complete`, 'PUT', data)
      .then(json => dispatch(receiveUpdateTask(json)))
  }
}

export const REQUEST_DELETE_TASK = "REQUEST_DELETE_TASK";
function requestDeleteTask(id) {
  return {
    type: REQUEST_DELETE_TASK
    , id
  }
}

export const RECEIVE_DELETE_TASK = "RECEIVE_DELETE_TASK";
function receiveDeleteTask(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_TASK
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteTask(id))
    return apiUtils.callAPI(`/api/tasks/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteTask(id, json)))
  }
}


/**
 * TASK LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest taskLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.task.lists, {});
  let list = { ...state.task.lists }
  for(let i = 0; i < listArgs.length; i++) {
    list = list[listArgs[i]];
    if(!list) {
      return false;
    }
  }
  return list;
}

const shouldFetchList = (state, listArgs) => {
  /**
   * Helper method to determine whether to fetch the list or not from arbitrary
   * listArgs
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetchList with these args ", listArgs, "?");
  const list = findListFromArgs(state, listArgs);
  // console.log("LIST in question: ", list);
  if(!list || !list.items) {
    // yes, the list we're looking for wasn't found
    // console.log("X shouldFetch - true: list not found");
    return true;
  } else if(list.isFetching) {
    // no, this list is already fetching
    // console.log("X shouldFetch - false: fetching");
    return false
  } else if(new Date().getTime() - list.lastUpdated > (1000 * 60 * 5)) {
    // yes, it's been longer than 5 minutes since the last fetch
    // console.log("X shouldFetch - true: older than 5 minutes");
    return true;
  } else {
    // maybe, depends on if the list was invalidated
    // console.log("X shouldFetch - " + list.didInvalidate + ": didInvalidate");
    return list.didInvalidate;
  }
}

export const fetchListIfNeeded = (...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchList(...listArgs));
  } else {
    return dispatch(returnTaskListPromise(...listArgs));
  }
}

export const returnTaskListPromise = (...listArgs) => (dispatch, getState) => {
  /**
   * This returns the list object from the reducer so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. This is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */

  // return the array of objects just like the regular fetch
  const state = getState();
  const listItemIds = findListFromArgs(state, listArgs).items
  const listItems = listItemIds.map(id => state.task.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_TASK_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_TASK_LIST = "REQUEST_TASK_LIST"
function requestTaskList(listArgs) {
  return {
    type: REQUEST_TASK_LIST
    , listArgs
  }
}

export const RECEIVE_TASK_LIST = "RECEIVE_TASK_LIST"
function receiveTaskList(json, listArgs) {
  return {
    type: RECEIVE_TASK_LIST
    , listArgs
    , list: json.tasks
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_TASK_TO_LIST = "ADD_TASK_TO_LIST";
export function addTaskToList(id, ...listArgs) {
  // console.log("Add task to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_TASK_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_TASK_FROM_LIST = "REMOVE_TASK_FROM_LIST"
export function removeTaskFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_TASK_FROM_LIST
    , id
    , listArgs
  }
}

export function fetchList(...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestTaskList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/tasks/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/tasks/by-[ARG1]/[ARG2]".
     *    ex: /api/tasks/by-category/:category
     *  if 2nd arg is an array, though, return "/api/tasks/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/tasks";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of tasks given an array of task id's, among other things
      apiTarget += `/by-${listArgs[0]}-list?`;
      // build query string
      for(let i = 0; i < listArgs[1].length; i++) {
        apiTarget += `${listArgs[0]}=${listArgs[1][i]}&`
      }
    } else if(listArgs.length == 2) {
      // ex: ("author","12345")
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if(listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for(let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveTaskList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_TASK_FILTER = "SET_TASK_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_TASK_FILTER
    , filter
    , listArgs
  }
}

export const SET_TASK_PAGINATION = "SET_TASK_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_TASK_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_TASK_LIST = "INVALIDATE_TASK_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_TASK_LIST
    , listArgs
  }
}
