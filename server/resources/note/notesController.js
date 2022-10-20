/**
 * Sever-side controllers for Note.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Note
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

let Note = require('mongoose').model('Note');
let User = require('mongoose').model('User');
let Task = require('mongoose').model('Task');

exports.list = (req, res) => {

}

exports.listByValues = (req, res) => {
  /**
   * returns list of notes queried from the array of _id's passed in the query param
   *
   * NOTES:
   * node default max request headers + uri size is 80kb.
   */

  if(!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}`});
  } else {
    Note.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notes) => {
        if(err || !notes) {
          res.send({success: false, message: `Error querying for notes by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, notes});
        }
    })
  }
}

exports.listByRefs = (req, res) => {
  // TODOOOO HERE
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   */

   // build query
  let query = {
    [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }

    Note.find(query, async (err, notes) => {
      
      const userIds = notes.map(x => x._user)
      const users = await User.find({'_id' : {'$in': userIds}})

      const notesWithCommentor = notes.map((note) => {
        const commentor = users.filter(user => String( note._user) === String(user._id))[0]

        return {...note._doc, commentor: {fullName: commentor.firstName + ' ' + commentor.lastName, created: commentor.created}}
      })

      if(err || !notes) {
        res.send({success: false, message: `Error retrieving notes by ${req.params.refKey}: ${req.params.refId}`});
      } else {
        res.send({success: true, notes: notesWithCommentor})
      }
    })
  }
}

exports.search = (req, res) => {
  // search by query parameters
  // NOTE: It's up to the front end to make sure the params match the model
  let mongoQuery = {};
  let page, per;

  for(key in req.query) {
    if(req.query.hasOwnProperty(key)) {
      if(key == "page") {
        page = parseInt(req.query.page);
      } else if(key == "per") {
        per = parseInt(req.query.per);
      } else {
        logger.debug("found search query param: " + key);
        mongoQuery[key] = req.query[key];
      }
    }
  }

  logger.info(mongoQuery);
  if(page || per) {
    page = page || 1;
    per = per || 20;
    Note.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, notes) => {
      if(err || !notes) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , notes: notes
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Note.find(mongoQuery).exec((err, notes) => {
      if(err || !notes) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, notes: notes });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get note by id');
  Note.findById(req.params.id).exec((err, note) => {
    if(err) {
      logger.error("ERROR:");
      logger.info(err);
      res.send({ success: false, message: err });
    } else if (!note) {
      logger.error("ERROR: Note not found.");
      res.send({ success: false, message: "Note not found." });
    } else {
      res.send({ success: true, note: note });
    }
  });
}

exports.getSchema = (req, res) => {
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get note full mongo schema object');
  res.send({success: true, schema: Note.getSchema()});
}


exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   */
  logger.info('get note default object');
  res.send({success: true, defaultObj: Note.getDefault()});
}

exports.create = async (req, res) => {
  await Task.findById(req.body._task).exec(async function(err, task) {
    if(err) {
      res.status(404);
      res.send({success: false, message: "NOT FOUND - INVALID TASK ID"});
    }

    const {_user, content} = req.body;
    const _task = req.body._task
    const _flow = task._flow

    const note = new Note({_user, _task, _flow, content});
    note.save();
    
    res.send({ success: true, message: 'Created note', note });
  })
}

exports.update = (req, res) => {
  
}

exports.delete = (req, res) => {
  logger.warn("deleting note");
  Note.findById(req.params.id).remove((err) => {
    if(err) {
      logger.error("ERROR:");
      logger.info(err);
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true, message: "Deleted note" });
    }
  });
}
