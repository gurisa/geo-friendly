import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import { 
  Table, TableBody, TableCell,TableHead, TablePagination, TableRow, TableSortLabel, 
  Toolbar, Typography, Paper, Checkbox, IconButton, Tooltip
} from '@material-ui/core';

import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';

import * as actions from '../../store/actions/index';
import AddCollections from './AddCollections/AddCollections';
import AddCollectionsAlert from './AddCollections/AddCollectionsAlert';
import AddCollectionsMessage from './AddCollections/AddCollectionsMessage';
import UpdateCollections from './UpdateCollections/UpdateCollections';
import UpdateCollectionsAlert from './UpdateCollections/UpdateCollectionsAlert';
import UpdateCollectionsMessage from './UpdateCollections/UpdateCollectionsMessage';
import DeleteCollections from './DeleteCollections/DeleteCollections';
import DeleteCollectionsMessage from './DeleteCollections/DeleteCollectionsMessage';
import Spinner from '../Spinner/Spinner';

function createData(id, name, rack_id, description) {
  return { id, name, rack_id, description };
}

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
  { id: 'id', numeric: false, disablePadding: true, label: 'Id' },
  { id: 'name', numeric: false, disablePadding: false, label: 'Name' },
  { id: 'rack_id', numeric: false, disablePadding: false, label: 'Racks Id' },
  { id: 'description', numeric: false, disablePadding: false, label: 'Description' }
];

class EnhancedTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount } = this.props;

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
          {rows.map(row => {
            return (
              <TableCell
                key={row.id}
                numeric={row.numeric}
                padding={row.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === row.id ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.id}
                    direction={order}
                    onClick={this.createSortHandler(row.id)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            );
          }, this)}
        </TableRow>
      </TableHead>
    );
  }
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  spacer: {
    flex: '1 1 100%',
  },
  actions: {
    color: theme.palette.text.secondary,
    display: 'flex',
  },
  title: {
    flex: '0 0 auto',
  }
});

let EnhancedTableToolbar = props => {
  const { numSelected, classes } = props;

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography id="tableTitle" variant='h6'>
            Collections Table
          </Typography>
        )}
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected === 1 ? (
          <React.Fragment>
            <Tooltip title="Edit" onClick={props.openUpdateHandler}>
              <IconButton aria-label="Edit">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete" onClick={props.openDeleteHandler}>
              <IconButton aria-label="Delete">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ) : numSelected > 1 ? (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <React.Fragment>
            <Tooltip title="Refresh" onClick={props.onRefresh}>
              <IconButton aria-label="Refresh">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add" onClick={props.openAddHandler}>
              <IconButton aria-label="Add">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        )}
      </div>
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired, 
};

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);

const styles = theme => ({
  root: {
    width: '100%',
    // marginTop: theme.spacing.unit * 3,
  },
  table: {
    width: '100%'
  },
  tableWrapper: {
    overflowX: 'auto',
    position: 'relative'
  },
});

class Collections extends React.Component {
  state = {
    order: 'asc',
    orderBy: 'id',
    selected: [],
    data: [],
    collections: [],
    ages: [],
    families: [],
    drawers: [],
    maps: [],
    acquisitions: [],
    users: [],
    add: {
      open: false,
      openAlert: false,
      message: {
        open: false,
        text: '',
        status: false
      },
      input: {
        code: '',
        name: '',
        inventory: '',
        registration: '',
        age_id: '',
        family_id: '',
        drawer_id: '',
        map_id: '',
        acquisition_id: '',
        user_id: ''
      },
      inputMessage: {
        code: '',
        name: '',
        inventory: '',
        registration: '',
        age_id: '',
        family_id: '',
        drawer_id: '',
        map_id: '',
        acquisition_id: '',
        user_id: ''
      }
    },
    update: {
      open: false,
      openAlert: false,
      message: {
        open: false,
        text: '',
        status: false
      },
      input: {
        code: '',
        name: '',
        inventory: '',
        registration: '',
        age_id: '',
        family_id: '',
        drawer_id: '',
        map_id: '',
        acquisition_id: '',
        user_id: ''
      },
      inputMessage: {
        code: '',
        name: '',
        inventory: '',
        registration: '',
        age_id: '',
        family_id: '',
        drawer_id: '',
        map_id: '',
        acquisition_id: '',
        user_id: ''
      }
    },
    delete: {
      open: false,
      message: {
        open: false,
        text: '',
        status: false
      }
    },
    page: 0,
    rowsPerPage: 5,
    token: localStorage.getItem('token'),
    loading: false
  };

  async componentDidMount() {
    await this.props.onFetch(this.state.token);
    this.props.onFetchFamilies(this.state.token);
    this.props.onFetchAcquisitions(this.state.token);
    this.props.onFetchMaps(this.state.token);
    this.props.onFetchAges(this.state.token);
    this.props.onFetchUsers(this.state.token);
    this.props.onFetchDrawers(this.state.token);
  }

  componentDidUpdate() {
    if (this.state.collections !== this.props.collections) {
      this.setState({
        data: [],
        collections: this.props.collections,
        loading: this.props.loading
      });
      this.props.collections.map(collection => (
        this.setState(prevState => ({
          data: [
            ...prevState.data,
            createData(collection.id, collection.name, collection.rack_id, collection.description)
          ]
        }))
      ));
    }

    if (this.state.families !== this.props.families) {
      this.setState({
        families: this.props.families,
      });
    }

    if (this.state.ages !== this.props.ages) {
      this.setState({
        ages: this.props.ages,
      });
    }

    if (this.state.drawers !== this.props.drawers) {
      this.setState({
        drawers: this.props.drawers,
      });
    }

    if (this.state.maps !== this.props.maps) {
      this.setState({
        maps: this.props.maps,
      });
    }

    if (this.state.acquisitions !== this.props.acquisitions) {
      this.setState({
        acquisitions: this.props.acquisitions,
      });
    }

    if (this.state.users !== this.props.users) {
      this.setState({
        users: this.props.users,
      });
    }
  }

  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = 'desc';

    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc';
    }

    this.setState({ order, orderBy });
  };

  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }));
      return;
    }
    this.setState({ selected: [] });
  };

  handleClick = (event, id) => {
    const { selected } = this.state;
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    this.setState({ selected: newSelected });
  };

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  isSelected = id => this.state.selected.indexOf(id) !== -1;

  unselectHandler = () => {
    this.setState({
      selected: []
    });
  }

  refreshHandler = () => {
    this.props.onFetch(this.state.token);
    this.props.onFetchRacks(this.state.token);
  }

  // ------------------- Add Function ---------------------
  openAddHandler = () => {
    this.setState(prevState => ({
      add: {
        ...prevState.add,
        open: true
      }
    }));
  }

  closeAddHandler = () => {
    this.setState(prevState => ({
      add: {
        ...prevState.add,
        open: false
      }
    }));
  }

  inputAddHandler = id => event => {
    const value = event.target.value;
    const name = [id][0];

    this.setState(prevState => ({
      add: {
        ...prevState.add,
        input: {
          ...prevState.add.input,
          [name]: value
        }
      }
    }));
  }

  resetInputAddHandler = () => {
    this.setState(prevState => ({
      add: {
        ...prevState.add,
        input: {
          name: '',
          rack_id: '',
          description: ''
        }
      }
    }));
  }

  addValidationHandler = () => {
    let name = '';
    let rack_id = '';
    let description = '';

    if (!this.state.add.input.name) {
      name = 'name is required';
    } else if (this.state.add.input.name.length < 4) {
      name = 'The name must be at least 4 characters';
    }

    if (!this.state.add.input.rack_id) {
      rack_id = 'racks id is required';
    }
    
    if (!this.state.add.input.description) {
      description = 'description is required';
    } else if (this.state.add.input.description.length < 4) {
      description = 'The description must be at least 4 characters';
    }

    this.setState(prevState => ({
      add: {
        ...prevState.add,
        inputMessage: {
          name,
          rack_id,
          description
        }
      }
    }));
  }

  toggleAddAlertHandler = async () => {
    await this.addValidationHandler();

    if ((!this.state.add.inputMessage.name) 
      && (!this.state.add.inputMessage.description) 
      && (!this.state.add.inputMessage.rack_id)) {
      this.setState(prevState => ({
        add: {
          ...prevState.add,
          openAlert: !prevState.add.openAlert
        }
      }));
    }
  }

  toggleMessageAddHandler = () => {
    this.setState(prevState => ({
      add: {
        ...prevState.add,
        message: {
          ...prevState.add.message,
          open: !prevState.add.message.open
        }
      }
    }));
  }

  messageAddHandler = () => {
    this.setState(prevState => ({
      add: {
        ...prevState.add,
        message: {
          open: true,
          text: this.props.add.message,
          status: this.props.add.status
        }
      }
    }));
  }

  saveAddHandler = async () => {
    await this.props.onPost(this.state.add.input, this.state.token);
    this.toggleAddAlertHandler();
    this.closeAddHandler();
    this.resetInputAddHandler();
    this.messageAddHandler()
  }

  // ------------------- Update Function ---------------------

  openUpdateHandler = () => {
    const input = this.state.drawers.filter(drawer => (
      drawer.id === this.state.selected[0]
    ));

    this.setState(prevState => ({
      update: {
        ...prevState.update,
        open: true,
        input: {
          name: input[0].name,
          rack_id: input[0].rack_id,
          description: input[0].description
        }
      }
    }));
  }

  closeUpdateHandler = () => {
    this.setState(prevState => ({
      update: {
        ...prevState.update,
        open: false
      }
    }));
  }

  resetInputUpdateHandler = () => {
    this.setState(prevState => ({
      update: {
        ...prevState.update,
        input: {
          name: '',
          rack_id: '',
          description: ''
        }
      }
    }));
  }

  inputUpdateHandler = id => event => {
    const value = event.target.value;
    const name = [id][0];

    this.setState(prevState => ({
      update: {
        ...prevState.update,
        input: {
          ...prevState.update.input,
          [name]: value
        }
      }
    }));
  }

  updateValidationHandler = () => {
    let name = '';
    let rack_id = '';
    let description = '';

    if (!this.state.update.input.name) {
      name = 'name is required';
    } else if (this.state.update.input.name.length < 4) {
      name = 'The name must be at least 4 characters';
    }

    if (!this.state.update.input.rack_id) {
      rack_id = 'rack id is required';
    }
    
    if (!this.state.update.input.description) {
      description = 'description is required';
    } else if (this.state.update.input.description.length < 4) {
      description = 'The description must be at least 4 characters';
    }

    this.setState(prevState => ({
      update: {
        ...prevState.update,
        inputMessage: {
          name,
          rack_id,
          description
        }
      }
    }));
  }

  toggleUpdateAlertHandler = async () => {
    await this.updateValidationHandler();

    if ((!this.state.update.inputMessage.name) 
      && (!this.state.update.inputMessage.rack_id)
      && (!this.state.update.inputMessage.description)) {
      this.setState(prevState => ({
        update: {
          ...prevState.update,
          openAlert: !prevState.update.openAlert
        }
      }));
    }
  }

  toggleMessageUpdateHandler = () => {
    this.setState(prevState => ({
      update: {
        ...prevState.update,
        message: {
          ...prevState.update.message,
          open: !prevState.update.message.open
        }
      }
    }));
  }

  messageUpdateHandler = () => {
    this.setState(prevState => ({
      update: {
        ...prevState.update,
        message: {
          open: true,
          text: this.props.update.message,
          status: this.props.update.status
        }
      }
    }));
  }
  
  saveUpdateHandler = async () => {
    const id = this.state.selected[0] ? this.state.selected[0].toString() : '1';

    await this.props.onUpdate(id, this.state.token, this.state.update.input);
    this.toggleUpdateAlertHandler();
    this.closeUpdateHandler();
    this.resetInputUpdateHandler();
    this.messageUpdateHandler();
  }

  // ------------------- Delete Function ---------------------

  deleteHandler = async () => {
    const id = this.state.selected[0];

    await this.props.onDelete(id, this.state.token);
    this.toggleDeleteAlertHandler();
    this.unselectHandler();
    this.messageDeleteHandler();
  }

  toggleDeleteAlertHandler = () => {
    this.setState(prevState => ({
      delete: {
        ...prevState.delete,
        open: !prevState.delete.open
      }
    }));
  }

  toggleMessageDeleteHandler = () => {
    this.setState(prevState => ({
      delete: {
        ...prevState.delete,
        message: {
          ...prevState.delete.message,
          open: !prevState.delete.message.open
        }
      }
    }));
  }

  messageDeleteHandler = () => {
    this.setState(prevState => ({
      delete: {
        ...prevState.delete,
        message: {
          open: true,
          text: this.props.delete.message,
          status: this.props.delete.status
        }
      }
    }));
  }

  render() {
    const { classes } = this.props;
    const { data, order, orderBy, selected, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
      <React.Fragment>
        {this.state.add.message.open
          ? <AddCollectionsMessage 
              closed={this.toggleMessageAddHandler} 
              message={this.state.add.message.text}
              status={this.state.add.message.status}
            />
          : null
        }

        {this.state.add.open 
          ? <AddCollections 
              closeAddHandler={this.closeAddHandler}
              input={this.state.add.input}
              inputMessage={this.state.add.inputMessage}
              changed={this.inputAddHandler} 
              onToggleAlert={this.toggleAddAlertHandler}
              racks={this.state.racks}
            /> 
          : null
        }

        <AddCollectionsAlert
          open={this.state.add.openAlert}
          onToggleAlert={this.toggleAddAlertHandler}
          added={this.saveAddHandler} />

        {this.state.update.message.open
          ? <UpdateCollectionsMessage 
              closed={this.toggleMessageUpdateHandler} 
              message={this.state.update.message.text}
              status={this.state.update.message.status}
            />
          : null
        }

        {this.state.update.open 
          ? <UpdateCollections 
              closed={this.closeUpdateHandler}
              input={this.state.update.input}
              inputMessage={this.state.update.inputMessage}
              changed={this.inputUpdateHandler} 
              onToggleAlert={this.toggleUpdateAlertHandler}
              racks={this.state.racks}
            /> 
          : null
        }

        <UpdateCollectionsAlert
          open={this.state.update.openAlert}
          onToggleAlert={this.toggleUpdateAlertHandler}
          updated={this.saveUpdateHandler} />

        {this.state.delete.message.open
          ? <DeleteCollectionsMessage 
              closed={this.toggleMessageDeleteHandler} 
              message={this.state.delete.message.text}
              status={this.state.delete.message.status}
            />
          : null
        }

        <DeleteCollections 
          open={this.state.delete.open}
          onToggleAlert={this.toggleDeleteAlertHandler}
          deleted={this.deleteHandler} />

        <Paper className={classes.root}>
          <EnhancedTableToolbar 
            numSelected={selected.length} 
            openDeleteHandler={this.toggleDeleteAlertHandler}
            openAddHandler={this.openAddHandler}
            openUpdateHandler={this.openUpdateHandler}
            onRefresh={this.refreshHandler}
          />

          <div className={classes.tableWrapper}>
            {this.props.loading ? <Spinner /> : null}

            <Table className={classes.table} aria-labelledby="tableTitle">
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={this.handleSelectAllClick}
                onRequestSort={this.handleRequestSort}
                rowCount={data.length}
              />

              <TableBody>
                {stableSort(data, getSorting(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(n => {
                    const isSelected = this.isSelected(n.id);
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, n.id)}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={-1}
                        key={n.id}
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} />
                        </TableCell>

                        <TableCell component="th" scope="row" padding="none">
                          {n.id}
                        </TableCell>

                        <TableCell component="th" scope="row" padding="default">
                          {n.name}
                        </TableCell>

                        <TableCell component="th" scope="row" padding="default">
                          {n.rack_id}
                        </TableCell>

                        <TableCell component="th" scope="row" padding="default">
                          {n.description}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 49 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{
              'aria-label': 'Previous Page',
            }}
            nextIconButtonProps={{
              'aria-label': 'Next Page',
            }}
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={this.handleChangeRowsPerPage}
          />
        </Paper>
      </React.Fragment>
    );
  }
}

Collections.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  return {
    collections: state.collectionsReducer.collections,
    ages: state.agesReducer.ages,
    maps: state.mapsReducer.maps,
    families: state.familiesReducer.families,
    users: state.usersReducer.users,
    acquisitions: state.acquisitionsReducer.acquisitions,
    drawers: state.drawersReducer.drawers,
    add: state.collectionsReducer.add,
    update: state.collectionsReducer.update,
    delete: state.collectionsReducer.delete,
    loading: state.collectionsReducer.loading
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onFetch: token => dispatch(actions.fetchCollections(token)),
    onFetchAges: token => dispatch(actions.fetchAges(token)),
    onFetchFamilies: token => dispatch(actions.fetchFamilies(token)),
    onFetchDrawers: token => dispatch(actions.fetchDrawers(token)),
    onFetchMaps: token => dispatch(actions.fetchMaps(token)),
    onFetchAcquisitions: token => dispatch(actions.fetchAcquisitions(token)),
    onFetchUsers: token => dispatch(actions.fetchUsers(token)),
    onPost: (drawer, token) => dispatch(actions.postCollections(drawer, token)),
    onDelete: (id, token) => dispatch(actions.deleteCollections(id, token)),
    onUpdate: (id, token, drawer) => dispatch(actions.updateCollections(id, token, drawer))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Collections));
