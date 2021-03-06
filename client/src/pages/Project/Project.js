import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PieChart } from 'react-minimal-pie-chart';
import KanBan from "../../components/KanBan";
import { Columns } from 'react-bulma-components'
import "./Project.css";
import API from "../../utils/API";
import AddProjectModal from "../../components/AddProjectModal";
import AddTaskModal from "../../components/AddTaskModal";
import EditProjectModal from "../../components/EditProjectModal";
import DeleteProjectModal from "../../components/DeleteProjectModal";
import moment from "moment";
import Select from "react-select";
import AUTH from '../../utils/AUTH';
import DatePicker from "react-datepicker";
import TeamMemberList from "../../components/TeamMemberList";
import Manager from "../../components/Tiles/Manager";

function Project() {
    //set the initial state
    const [projects, setProjects] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [openTask, setOpenTask] = useState({});
    const [selectedProject, setSelectedProject] = useState({});
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [editModalIsOpen, setEditIsOpen] = useState(false);
    const [taskModalIsOpen, setTaskIsOpen] = useState(false);
    const [delModalIsOpen, setDelIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({});
    let { id } = useParams();

    useEffect(() => {
        loadProjects();
    }, []);

    // Param from URL
    // ex: if "projects/1", the second project will be set on page load
    useEffect(() => {
        if (id) {
            setCurrentProject(id);
        }
    }, [users, tasks, projects])

    function openModal() {
        setIsOpen(true);
    }
    function closeModal() {
        setIsOpen(false);
    }
    function openTaskModal() {
        setTaskIsOpen(true);
    }
    function closeTaskModal() {
        setTaskIsOpen(false);
    }
    function openEditModal() {
        setEditIsOpen(true);
    }
    function closeEditModal() {
        setEditIsOpen(false);
    }
    function openDelModal() {
        setDelIsOpen(true);
    }
    function closeDelModal() {
        setDelIsOpen(false);
    }

    // Calls 4 APIs (Projects, Tasks, Users, Logged in user) and loads them into 4 arrays
    function loadProjects() {
        API.getProjects()
            .then(res => {
                if (res.data.projects) {
                    setProjects(res.data.projects);
                }
            })
            .catch(err => console.log(err))
            .then(API.getAllTasks()
                .then(res2 => {
                    if (res2.data.tasks) {
                        setTasks(res2.data.tasks);
                    }
                })
            )
            .catch(err => console.log(err))
            .then(API.getUsers()
                .then(res3 => {
                    if (res3.data) {
                        setUsers(res3.data);
                    }
                })
            )
            .catch(err => console.log(err))
            .then(AUTH.getUser()
                .then(res4 => {
                    setCurrentUser(res4.data.user);
                })
            )
            .catch(err => console.log(err))
    }

    // Sets the "Current Task" at the bottom with the task ID clicked from the user
    function handleSelectedTask(e) {
        e.preventDefault();

        // ID is retrieved from the task that was clicked
        let id = e.target.getAttribute("value")

        // Returns the task that matches the given ID
        let filteredTask = tasks.filter(e => {
            return e._id === id
        })

        // Gets list of users assigned to the task by comparing assigned user's IDs with user database
        let filteredUsers = [];
        for (let i = 0; i < filteredTask[0].assignedUsers.length; i++) {
            users.forEach(user => {
                if (user._id === filteredTask[0].assignedUsers[i]) {
                    filteredUsers.push(user);
                }
            })
        };

        // Gets task owner's username by comparing task owner ID with user database
        let manager = users.filter(e => {
            return e._id === filteredTask[0].owner.id;
        });

        
        setOpenTask({
            ...openTask,
            i: projectTasks.findIndex(task => task._id === filteredTask[0]._id),
            id: filteredTask[0]._id,
            title: filteredTask[0].title,
            urgency: filteredTask[0].urgency,
            status: filteredTask[0].status,
            owner: filteredTask[0].owner,
            dueDate: new Date(filteredTask[0].dueDate),
            team: filteredUsers,
            manager: manager[0].username
        });
    }

    // Selecting a project on the left will take it's ID and load the information and tasks related to that project
    function setCurrentProject(e) {

        if (projects.length > 0) {
            // i is the index number from the project list on the left panel
            let i = 0;
            if (e.currentTarget) i = e.currentTarget.value;
            else i = e;

            // Loads tasks only associated with the project ID
            let taskArray = [];
            tasks.forEach(task => {
                if (projects[i]._id === task.project) {
                    taskArray.push(task);
                }
            });
            setProjectTasks(taskArray);

            // Gets list of users assigned to the project by comparing assigned user's IDs with user database
            let filteredUsers = [];
            for (let e = 0; e < projects[i].assignedUsers.length; e++) {
                users.forEach(user => {
                    if (user._id === projects[i].assignedUsers[e]) {
                        filteredUsers.push(user);
                    }
                })
            };

            // Gets project owner's information by comparing project owner ID with user database
            let owner = {};
            users.forEach(user => {
                if (user._id === projects[i].owner.id) {
                    owner = user;
                }
            })

            setSelectedProject({
                ...selectedProject,
                title: projects[i].title,
                id: projects[i]._id,
                dueDate: projects[i].dueDate,
                assignedUsers: projects[i].assignedUsers,
                owner: owner,
                usernames: filteredUsers,
                selected: i
            });
        }
    }

    // Moment function to show tasks relating to current week
    function compareWeek(x) {
        if (moment(x.dueDate).isSame(new Date(), "week")) return true
        else return false
    }

    function handleUrgencyChange(x) {
        setOpenTask({
            ...openTask,
            urgency: x.value
        });
    }
    function handleStatusChange(x) {
        setOpenTask({
            ...openTask,
            status: x.value
        });
    }
    function handleTaskTitleChange(e) {
        setOpenTask({
            ...openTask,
            title: e.target.value
        })
    }

    function statusLabel(x) {
        switch (x) {
            case "toDo":
                return "To Do";
            case "inProgress":
                return "In Progress";
            case "completed":
                return "Completed";
            default:
                return "";
        }
    }

    // Updates task to the database along with the current page without needing to reload
    function updateTask(e) {
        e.preventDefault();
        let assignedUsersId = [];
        openTask.team.forEach(user => {
            assignedUsersId.push(user._id)
        })

        API.updateTask(openTask.id, {
            title: openTask.title,
            status: openTask.status,
            urgency: openTask.urgency,
            assignedUsers: assignedUsersId,
            dueDate: openTask.dueDate
        })
        .catch(err => console.log(err));

        setProjectTasks(projectTasks.map(task => {
            if (task._id !== openTask.id) return task
            return {
                ...task,
                title: openTask.title,
                status: openTask.status,
                urgency: openTask.urgency,
                assignedUsers: assignedUsersId,
                dueDate: openTask.dueDate
            }
        }))
        setTasks(tasks.map(task => {
            if (task._id !== openTask.id) return task
            return {
                ...task,
                title: openTask.title,
                status: openTask.status,
                urgency: openTask.urgency,
                assignedUsers: assignedUsersId,
                dueDate: openTask.dueDate
            }
        }))
    }

    function statusStyle(x) {
        switch (x) {
            case "toDo":
                return "has-background-danger";
            case "inProgress":
                return "has-background-warning-light";
            case "completed":
                return "has-background-success-light";
            default:
                return "";
        }
    }

    function urgentStyle(x) {
        switch (x) {
            case "low":
                return "has-background-link-light";
            case "medium":
                return "has-background-success-light";
            case "high":
                return "has-background-danger-light ";
            case "urgent":
                return "has-background-danger";
            default:
                return "";
        }
    }

    return (
        <div>
            <Columns>
                <Columns.Column size="2">
                    <div className="block ml-3 menu-parent">
                        <aside className="menu">
                            <p className="menu-label">Active Projects</p>
                            <ul className="menu-list">
                                {projects ? projects.map((proj, i) => (
                                    <li
                                        key={proj._id}
                                        onClick={setCurrentProject}
                                        value={i}
                                        className={selectedProject.selected === i ? "has-background-success-light" : ""}
                                    >
                                        <a>{proj.title}</a>
                                    </li>
                                )) : ""}
                                <AddProjectModal
                                    modalIsOpen={modalIsOpen}
                                    closeModal={closeModal}
                                    openModal={openModal}
                                    ariaHideApp={false}
                                    users={users}
                                    currentUser={currentUser}
                                />
                                {/* If a project is already selected, the task model will pre-select the project name */}
                                {selectedProject.id ? 
                                    <AddTaskModal
                                        modalIsOpen={taskModalIsOpen}
                                        closeModal={closeTaskModal}
                                        openModal={openTaskModal}
                                        ariaHideApp={false}
                                        users={users}
                                        projects={projects}
                                        currentUser={currentUser}
                                        selectedProject={selectedProject}
                                    />
                                :   <AddTaskModal
                                        modalIsOpen={taskModalIsOpen}
                                        closeModal={closeTaskModal}
                                        openModal={openTaskModal}
                                        ariaHideApp={false}
                                        users={users}
                                        projects={projects}
                                        currentUser={currentUser}
                                    />
                                }
                            </ul>
                        </aside>
                    </div>
                </Columns.Column>
                <Columns.Column size="9">
                    <div className="block">
                        <h1 className="has-text-centered title is-1 mt-3">
                            {selectedProject.title ?
                                <>
                                    {selectedProject.title}

                                    {/* Shows edit icon only if logged in user is the project owner */}
                                    {selectedProject.owner._id === currentUser._id &&
                                        <div>
                                            <EditProjectModal
                                                project={selectedProject}
                                                users={users}
                                                modalIsOpen={editModalIsOpen}
                                                closeModal={closeEditModal}
                                                openModal={openEditModal}
                                                ariaHideApp={false}
                                                currentUser={currentUser}
                                            />
                                            <DeleteProjectModal
                                                project={selectedProject}
                                                delModalIsOpen={delModalIsOpen}
                                                closeDelModal={closeDelModal}
                                                openDelModal={openDelModal}
                                                ariaHideApp={false}
                                            />
                                        </div>
                                    }
                                </>
                                : projects.length === 0 ? "No projects found, please create one"
                                    : "Please select a project"
                            }
                        </h1>
                    </div>

                    {/* tiles start here */}

                    <div className="tile is-ancestor mt-4">
                        <div className="tile is-vertical is-8">
                            <div className="tile">
                                <div className="tile is-parent is-vertical">
                                    <article className="tile is-child notification is-danger">
                                        <div className='content is-medium'>
                                            <h5 className="title is-3">Urgent: </h5>
                                            <ul>
                                                {projectTasks && projectTasks.map(task => {
                                                    return (
                                                        task.urgency === "urgent" && <li key={task._id}>{task.title}</li>
                                                    )
                                                }
                                                )}
                                            </ul>
                                        </div>
                                    </article>
                                    <article className="tile is-child notification is-warning">
                                        <div className='content is-medium'>
                                            <h5 className="title is-3">This Week: </h5>
                                            <ul>
                                                {projectTasks && projectTasks.map(task => {
                                                    return (
                                                        compareWeek(task) && <li key={task._id}>{task.title}</li>
                                                    )
                                                }
                                                )}
                                            </ul>
                                        </div>
                                    </article>
                                </div>
                                <div className="tile is-parent">
                                    <article className="tile is-child notification is-info">
                                        <div className="block">
                                            <h2 className="title is-3">Project Progress</h2>
                                            {selectedProject.title &&
                                                <h4 className="title is-5 mb-5">Due Date: {moment(selectedProject.dueDate).format('MMMM Do YYYY')}</h4>
                                            }
                                            <PieChart
                                                data={[
                                                    { title: 'To Do', value: projectTasks.filter(e => { return e.status === "toDo" }).length, color: '#DD1E2f' },
                                                    { title: 'In Progress', value: projectTasks.filter(e => { return e.status === "inProgress" }).length, color: '#ebb035' },
                                                    { title: 'Completed', value: projectTasks.filter(e => { return e.status === "completed" }).length, color: '#218559' },
                                                ]}
                                                lineWidth={66}
                                                radius={30}
                                                center={[50, 30]}
                                                viewBoxSize={[100, 60]}
                                                startAngle={270}
                                                paddingAngle={2}
                                            />
                                            {/* <BarGraph /> */}
                                        </div>
                                    </article>
                                </div>
                            </div>
                            {selectedProject.owner &&
                                <Manager 
                                    manager={selectedProject.owner}
                                />
                            }
                            
                        </div>
                        <div className="tile is-parent">
                            <article className="tile is-child notification is-success">
                                <div className="content is-medium">
                                    <p className="title">Team Members</p>
                                    <ul>
                                        {selectedProject.usernames && selectedProject.usernames.map((member) => {
                                            return (
                                                <TeamMemberList 
                                                    user={member}
                                                    key={member._id}
                                                />
                                            )
                                        })}
                                    </ul>
                                    <div className="content">

                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>

                    {/* kanBan tiles */}
                    <div className="box px-3 has-background-primary">
                        <div className="tile is-ancestor">
                            <div className="tile is-parent">
                                <article className="tile is-child box">
                                    <p className="title has-text-centered">To Do</p>
                                    <KanBan
                                        key="todo_tasks"
                                        title="To Do"
                                        tasks={projectTasks}
                                        handleSelectedTask={handleSelectedTask}
                                        users={users}
                                        i={selectedProject.selected}
                                    />
                                </article>
                            </div>
                            <div className="tile is-parent">
                                <article className="tile is-child box">
                                    <p className="title has-text-centered">In Progress</p>
                                    <KanBan
                                        key="inProgress_tasks"
                                        title="In Progress"
                                        tasks={projectTasks}
                                        handleSelectedTask={handleSelectedTask}
                                        users={users}
                                        i={selectedProject.selected}
                                    />
                                </article>
                            </div>
                            <div className="tile is-parent">
                                <article className="tile is-child box">
                                    <p className="title has-text-centered">Completed</p>
                                    <KanBan
                                        key="completed_tasks"
                                        title="Completed"
                                        tasks={projectTasks}
                                        handleSelectedTask={handleSelectedTask}
                                        users={users}
                                        i={selectedProject.selected}
                                    />
                                </article>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>
                            <h4 className="subtitle is-4">Current Task</h4>
                            <form>
                                <table className="table mb-3">
                                    <thead>
                                        <tr>
                                            <th>Task</th>
                                            <th className="tableDate">Due Date</th>
                                            <th>Urgency</th>
                                            <th>Status</th>
                                            <th>Team</th>
                                            <th>Manager</th>
                                            <th>Update</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <input
                                                    className="input"
                                                    size="9"
                                                    type="text"
                                                    value={openTask.title}
                                                    onChange={handleTaskTitleChange}
                                                    disabled={!openTask.id}
                                                >
                                                </input>
                                            </td>
                                            <td className="tableDate">
                                                <DatePicker 
                                                    selected={openTask.dueDate}
                                                    onChange={date => setOpenTask({...openTask, dueDate: date})}
                                                    className="form-control"
                                                    disabled={!openTask.id}
                                                />
                                            </td>
                                            <td className={urgentStyle(openTask.urgency)}>
                                                <Select
                                                    value={{
                                                        value: openTask.urgency,
                                                        label: (openTask.urgency ? openTask.urgency[0].toUpperCase() + openTask.urgency.substring(1) : "")
                                                    }}
                                                    options={[
                                                        { value: "low", label: "Low" },
                                                        { value: "medium", label: "Medium" },
                                                        { value: "high", label: "High" },
                                                        { value: "urgent", label: "Urgent" }
                                                    ]}
                                                    onChange={handleUrgencyChange}
                                                    menuPlacement="top"
                                                    isDisabled={!openTask.id}
                                                />

                                            </td>
                                            <td className={statusStyle(openTask.status)}>
                                                <Select
                                                    value={{
                                                        value: openTask.status,
                                                        label: (openTask.status ? statusLabel(openTask.status) : "")
                                                    }}
                                                    options={[
                                                        { value: "toDo", label: "To Do" },
                                                        { value: "inProgress", label: "In Progress" },
                                                        { value: "completed", label: "Completed" }
                                                    ]}
                                                    onChange={handleStatusChange}
                                                    menuPlacement="top"
                                                    isDisabled={!openTask.id}
                                                />
                                            </td>
                                            <td>
                                                {openTask.team ? openTask.team.map((user, i) => (
                                                    (i ? ", " : "") + user.username
                                                )) : ""}
                                            </td>
                                            <td>{openTask.manager}</td>
                                            <td>
                                                <button
                                                    type="submit"
                                                    className="button is-primary"
                                                    onClick={updateTask}
                                                    disabled={!openTask.id}
                                                >
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </form>
                        </div>
                    </div>
                </Columns.Column>
            </Columns>
        </div>
    )
}

export default Project;