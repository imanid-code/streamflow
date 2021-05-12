import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { Input, TextArea, FormBtn } from "../../components/Form";
import API from "../../utils/API";
import Select from 'react-select';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: "500px",
    height: "500px"
  }
};

function EditProjectModal(props) {
  const [formObject, setFormObject] = useState({});
  const [userList, setUserList] = useState([]);
  const formEl = useRef(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [addUsers, setAddUsers] = useState([]);

  function setFormUsers() {
    setUserList(props.users);
    setFormObject({
      title: props.project.title,
      date: new Date(props.project.dueDate),
      assignedUsers: props.project.assignedUsers,
      owner: props.project.owner
    })

    let filterUsers = [];
    props.users.map(user => {
      props.project.assignedUsers.map(assignedUser => {
        if (user._id === assignedUser) {
          if (!filterUsers.some(x => x._id === assignedUser)) {
            filterUsers.push(user);
          }
        }
      })
    })

    let userSelect = [];
    let userArray = [];
    filterUsers.map(user => {
      let obj = {
        value: user._id,
        label: user.username
      }
      userSelect.push(obj);
      userArray.push(user._id);
    })
    setAddUsers(userArray);
    setFilteredUsers(userSelect);
  }

  function debug() {
    console.log(formObject)
    console.log(addUsers);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormObject({ ...formObject, [name]: value })
  };

  function handleSelectedUser(options) {
    let userArray = [];
    let userSelect = [];
    options.map(user => {
      userArray.push(user.value);
      userSelect.push(user);
    })
    setAddUsers(userArray);
    setFilteredUsers(userSelect);
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (formObject.title) {
      API.updateProject(props.project.id, {
        title: formObject.title,
        dueDate: formObject.date,
        assignedUsers: addUsers,
        owner: formObject.owner
      })
        .then(res => {
          formEl.current.reset();
          window.location.reload();
        })
        .catch(err => console.log(err));
    }
  };

  return (
    <div>
      <span><a href="#" onClick={props.openModal}><i className="fas fa-edit" /></a></span>
      <Modal
        isOpen={props.modalIsOpen}
        onAfterOpen={setFormUsers}
        onRequestClose={props.closeModal}
        style={customStyles}
        contentLabel="Edit Project Modal"
      >

        <h2>Manage Project Information</h2>
        <form ref={formEl}>
          <Input
            value={formObject.title}
            onChange={handleInputChange}
            name="title"
            placeholder="Title (required)"
            onClick={debug}
          />
          <DatePicker
            selected={formObject.date}
            onChange={date => setFormObject({...formObject, date: date})}
            className="form-control mb-2"
            placeholderText="Due date (required)"
          />
          <div>
            Assign user(s)
            <Select
              options={userList.map(users => (
                {value: users._id, label: users.username}
              ))}
              value={filteredUsers}
              isMulti
              onChange={handleSelectedUser}
            />
          </div>
          <hr />
          <FormBtn
            disabled={!formObject.title}
            onClick={handleFormSubmit}
          >
            Update Project
          </FormBtn>
        </form>
      </Modal>
    </div>
  );
}

export default EditProjectModal;