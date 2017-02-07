
// depends on nothing

// class for sequential code execution
// after creation, items can be added to it
// then a callback has to be defined that will be called when all items are done

// make sure that you define the callback when there are some items already,
// otherwise it will be called immediately

// can be used if for instance some files need to be loaded until a piece of
// code can be executed

function Checklist(){
    this.items = [];
    this.done = [];
    this.callback = {};
    this.timerID = {};

    this.addItem = function(name){
        this.items.push(name);
        this.done.push(false);
    }

    this.checkItem = function(name){
        this.done[this.items.indexOf(name)] = true;
    }

    this.setCallback = function(callback){
        this.callback = callback;
        this.timerID = setInterval(function(obj){
            var allDone = true;
            for(var i=0; i<obj.done.length; i++){
                if(!obj.done[i]){
                    allDone = false;
                    break;
                }
            }
            if(allDone){
                clearInterval(obj.timerID);
                obj.callback();
                obj.callback = {};
            }
        }, 50, this); // call every 50ms
    }
}
