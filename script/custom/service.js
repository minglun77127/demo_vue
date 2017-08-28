var ServiceFactory = new function(){
	let _baseUrl = "http://localhost:8080";

	let _programService = {
		getAllPrograms(){
			return $.getAsObservable(`${_baseUrl}/service/program/get`)
				.map(res=>res.data)
				.catch(error=>handleError('load programs'));
		}
	};
	let _courseService = {
		getCourseByProgramID(pID){
			return $.getAsObservable(`${_baseUrl}/service/course/get/pID/${pID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load courses'));
		}
	};
	let _courseScheduleService = {
		getScheduleByCourseID(cID){
			return $.getAsObservable(`${_baseUrl}/service/courseschedule/get/cID/${cID}`)
				.map(res=>res.data)
				.catch(error=>handleError('course schedule'));
		},
		getScheduleByClassID(classID){
			return $.getAsObservable(`${_baseUrl}/service/courseschedule/get/classID/${classID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load schedule'));
		},
		createCourseSchedule(schedule={}, timings=[]){
			return $.postAsObservable(`${_baseUrl}/service/courseschedule/create`, {schedule: JSON.stringify(schedule), timings: JSON.stringify(timings)})
				.map(res=>res.data)
				.catch(error=>handleError('create schedule'));
		},
		updateCourseSchedule(schedule){
			return $.postAsObservable(`${_baseUrl}/service/courseschedule/update`, {schedule: JSON.stringify(schedule)})
				.map(res=>res.data)
				.catch(error=>handleError('update schedule'));
		},
		deleteCourseSchedule(csID) {
			return $.postAsObservable(`${_baseUrl}/service/courseschedule/delete/csID/${csID}`)
				.map(res=>res.data)
				.catch(error=>handleError('delete schedule'));
		}
	};
	let _courseTimingService = {
		getCourseTimingByCSID(csID){
			return $.getAsObservable(`${_baseUrl}/service/coursetiming/get/csID/${csID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load course times'));
		},
		createCourseTiming(courseTiming){
			return $.postAsObservable(`${_baseUrl}/service/coursetiming/create`, {courseTiming: JSON.stringify(courseTiming)})
				.map(res=>res.data)
				.catch(error=>handleError('create course times'));
		},
		deleteCourseTimingByCtID(ctID){
			return $.getAsObservable(`${_baseUrl}/service/coursetiming/delete/ctID/${ctID}`)
				.map(res=>res.data)
				.catch(error=>handleError('delete course times'));
		}
	};
	let _studentService = {
		getStudentsByCSID(csID){
			return $.getAsObservable(`${_baseUrl}/service/student/get/csID/${csID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load students'));
		},

		getAllStudents(){
			return $.getAsObservable(`${_baseUrl}/service/student/get`)
				.map(res=>res.data)
				.catch(error=>handleError('load students'));
		},
		getScheduleToStudentsByClassID(classID){
			return $.getAsObservable(`${_baseUrl}/service/student/get/scheduleTo/classID/${classID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load students'));
		}
	};
	let _userService = {
		getFacultyByCSID(csID){
			return $.getAsObservable(`${_baseUrl}/service/user/get/faculty/csID/${csID}`)
				.map(res=>res.data)
				.catch(error=>handleError('load faculties'));
		},
		getUsersByRole(role){
			return $.getAsObservable(`${_baseUrl}/service/user/get/role/${role}`)
				.map(res=>res.data)
				.catch(error=>handleError('load faculties'));
		},
		getUserImageByID(id){
			return $.getAsObservable(`${_baseUrl}/service/user/get/image/id/${id}`)
				.map(res=>res.data)
				.catch(error=>handleError('load image'));
		}
	};
	let _studentCourseService = {
		createStudentCourse(csID, students){
			return $.postAsObservable(`${_baseUrl}/service/studentcourse/create`, {csID: csID, students: JSON.stringify(students)})
				.map(res=>res.data)
				.catch(error=>handleError('assign student'));
		},
		unenrollStudent(csID, studID){
			return $.postAsObservable(`${_baseUrl}/service/studentcourse/delete`, {csID: csID, studID: studID})
				.map(res=>res.data)
				.catch(error=>handleError('disenroll student'));
		}
	};

	let handleError = (error) => {
		return Rx.Observable.throw(`Cannot connect to server, fail to ${error}, make sure you are connected to internet`);
	};

	return {
		getService(service){
			switch(service){
				case 'Program': return _programService;
				case 'Course': return _courseService;
				case 'CourseSchedule': return _courseScheduleService;
				case 'CourseTiming': return _courseTimingService;
				case 'Student': return _studentService;
				case 'User': return _userService;
				case 'StudentCourse': return _studentCourseService;
			}
		}
	}
};