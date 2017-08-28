var timeUtil= new function(){
   this.hr24TimeOf = function(time){
        let hours = Number(time.match(/^(\d+)/)[1]);
        let minutes = Number(time.match(/:(\d+)/)[1]);
        let AMPM = time.match(/\s(.*)$/)[1];
        if(AMPM.toUpperCase() == "PM" && hours<12) hours = hours+12;
        if(AMPM.toUpperCase() == "AM" && hours==12) hours = hours-12;
        let sHours = hours.toString();
        let sMinutes = minutes.toString();
        if(hours<10) sHours = "0" + sHours;
        if(minutes<10) sMinutes = "0" + sMinutes;
        return sHours + ":" + sMinutes;
    };

    this.addHoursMins = function(time='00:00', hrs=0, mins=0){
        let hours = Number(time.match(/^(\d+)/)[1]);
        let minutes = Number(time.match(/:(\d+)/)[1]);
        let AMPM = time.match(/\s(.*)$/)? time.match(/\s(.*)$/)[1]: '';

        minutes += hrs*60 + mins;

        while(minutes >= 60){
            minutes -= 60;
            hours++;
        }

        if(AMPM.toUpperCase() == "AM" && hours>=12){
            hours = hours-12;
            AMPM = "PM";
        }

        if(hours<10) hours = "0" + hours;
        if(minutes<10) minutes = "0" + minutes;

        return hours + ":" + minutes + (AMPM?' '+ AMPM : '');
    };

    this.timeDiff = function(from, to){
        from = this.hr24TimeOf(from);
        to = this.hr24TimeOf(to);

        let fromHours = Number(from.match(/^(\d+)/)[1]);
        let fromMins = Number(from.match(/:(\d+)/)[1]);

        let toHours = Number(to.match(/^(\d+)/)[1]);
        let toMins = Number(to.match(/:(\d+)/)[1]);

        return toHours - fromHours + (toMins - fromMins)/60;

        /*from = from == '12:00 pm'? '00:00 pm': from;
        to = to == '12:00 pm'? '00:00 pm': to;
        let minsDiff = Number(to.match(/:(\d+)/)[1]) - Number(from.match(/:(\d+)/)[1]);
        let hoursDiff = Number(to.match(/^(\d+)/)[1]) - Number(from.match(/^(\d+)/)[1]) + minsDiff/60;
        hoursDiff += to.match(/\s(.*)$/)[1] != from.match(/\s(.*)$/)[1]? 12 : 0;
        console.log(hoursDiff);
        return hoursDiff;*/
    };
};

var objectUtil = new function(){
    this.initResettable = function(obj){
        var originValues = {};
        for(let prop in obj){
            if(obj.hasOwnProperty(prop) && prop != 'originValues'){
                originValues[prop] = obj[prop];
            }
        }
        obj.originValues = originValues;
    };
    this.reset = function(obj){
        if(!obj.originValues) {
            console.log('object not resttable!');
            return obj;
        }
        for(let prop in obj.originValues){
            obj[prop] = obj.originValues[prop];
        }
    };
};