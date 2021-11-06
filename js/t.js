const TaskmanPassives = function(){
    let passiveList = [];

    const tierAbbreviations = {
        "-": "-",
        Beginner: "BEG",
        Easy: "EASY",
        Medium: "MED",
        Hard: "HARD",
        Elite: "ELITE",
        Master: "MAST",
        Legendary: "LGND",
        God: "GOD"
    }

    const tierOrder = ["Beginner","Easy","Medium","Hard","Elite","Master","Legendary","God","-"];

    let tierRequirements = {
        Beginner: 15,
        Easy: 60,
        Medium: 100,
        Hard: 190,
        Elite: 320,
        Master: 440,
        Legendary: 550,
        Completion: 684
    }

    const spotlight = {
        start: "2021-11-03 00:00:00",
        startMS: new Date("2021-11-03 00:00:00").getTime(),
        minigames: [
            "Conquest",
            "Fishing Trawler",
            "Great Orb Project",
            "Flash Powder Factory",
            "Castle Wars",
            "Stealing Creation",
            "Cabbage Facepunch Bonanza",
            "Heist",
            "Soul Wars",
            "Barbarian Assault",
            "Conquest",
            "Fist of Guthix",
            "Castle Wars",
            "Pest Control",
            "Soul Wars",
            "Fishing Trawler",
            "Great Orb Project",
            "Flash Powder Factory",
            "Stealing Creation",
            "Cabbage Facepunch Bonanza",
            "Heist",
            "Trouble Brewing",
            "Castle Wars",
            "Pest Control",
            "Soul Wars",
            "Fist of Guthix",
            "Barbarian Assault"
        ],
        getCurrentMinigame: (dateAsMS) => {
            let daysDiff = ((dateAsMS||Date.now()) - spotlight.startMS)/(1000*60*60*24);
            console.log(daysDiff);
            let rotationSteps = Math.floor(daysDiff/3);
            console.log(rotationSteps);
            return spotlight.minigames[rotationSteps%27];
        }
    }
    const init = () => {
        $('.tableHeader').on('click', function(){
            const sortBy = $(this).text();
            console.log(sortBy);

            sortPassivesBy(sortBy.trim())
        });

        console.log(spotlight.getCurrentMinigame());

        $('#impexpbtn').on('click', () => {
            $('.taskImporter').css('display',$('taskImporter').css('display')=="block"?"none":"block");
        });

        $('#btn_impexpclose').on('click', () => {
            $('.taskImporter').css('display','none');
        })

        $('#btn_import').on('click', () => {
            const importInput = $('#taskProgressInput').val();

            if(!importInput.length){
                alert("You haven't provided any input!");
                return;
            }
            console.log(importInput);
            try{
                $.parseJSON(importInput);
            }
            catch(err){
                alert("There was a problem with the provided input. Check that the result from the code above was copied correctly and try again!");
                return;
            }

            //Task list seems fine, clear the old, input the new
            const a = confirm("Importing completed tasks will clear all tasks currently marked as completed. Any tasks marked as planned will remain. Continue?");

            if(!a) return;

            console.log("Clearing and importing tasks!");
            passiveList.forEach(p => {
               markCompleted(p,false,null); 
            });

            const parsedInput = $.parseJSON(importInput);

            if(parsedInput.planned){
                console.log("Planned tasks importing first!");
                parsedInput.planned.forEach(code => {
                    let codeMatch = passiveList.filter(p => p.passiveTaskCode == code)[0];
                    if(codeMatch){
                        markPlanned(codeMatch,true,null);
                    }
                });
            }
            

            parsedInput.completed.forEach(code => {
                let codeMatch = passiveList.filter(p => p.passiveTaskCode == code)[0];
                if(codeMatch){
                    markCompleted(codeMatch,true,null);
                }
            });

            
            

            createTable();
        });

        $('#btn_export').on('click', () => {
            const taskCodeListCompleted = passiveList.filter(p => p.completed).map(p => p.passiveTaskCode);
            const taskCodeListPlanned = passiveList.filter(p => p.planned).map(p => p.passiveTaskCode);

            let exportData = {
                completed: taskCodeListCompleted,
                planned: taskCodeListPlanned
            }
            $('#taskProgressExport').val(JSON.stringify(exportData));
        });
    }
  

    const getPassiveList = () => {
        $.ajax({
            url: 'data/latestDatabaseExport.json',
            method: 'POST',
            dataType: 'JSON',
            success: function(data){
                console.log(data);

                passiveList = data;

                tierRequirements.Completion = passiveList.length;                
                
                calculateTierRequirements();

                if(localStorage.getItem('planned-passives')){
                    console.log("Passive plans previously registered, importing from localStorage");
                    importPlans(localStorage.getItem('planned-passives'));
                }
                
                if(localStorage.getItem('completed-passives')){
                    console.log("Passive completions previously registered, importing from localStorage");
                    importCompletions(localStorage.getItem('completed-passives'));
                }
                else{
                    createTable();
                }

                
                for(k in tierRequirements){
                    if(k == "Completion") return;

                    let progressMS = document.createElement('div');
                    progressMS.classList.add('progressMilestone');
                    progressMS.style.left = `${100*tierRequirements[k]/tierRequirements.Completion}%`;
                    progressMS.setAttribute('tasksRequired',tierRequirements[k]);
                    const displayTier = tierOrder[tierOrder.indexOf(k)+1];
                    progressMS.innerHTML = `&nbsp;&nbsp;${displayTier[0]}<span class="restOfWord">${displayTier.slice(1)}</span>`;

                    if(passiveList.filter(p => p.completed).length >= tierRequirements[k]){
                        progressMS.classList.add('completed');
                    }
                    else if(passiveList.filter(p => p.completed).length+passiveList.filter(p => p.planned).length >= tierRequirements[k]){
                        progressMS.classList.add('planned');
                    }

                    $('.progressBarContainer').append(progressMS)
                }

 
            }
        });
    }

    getPassiveList();

    const createTable = () => {

        $('.passiveTable').html(passiveList.map((p,i) => {
            return `
            <div class="passiveRow ${i%2==0?"even":"odd"} ${p.planned?"planned":""} ${p.completed?"completed":""}" taskcode="${p.passiveTaskCode}">
                <div class="passiveTableCell passiveCode">${p.passiveTaskCode}</div>
                <div class="passiveTableCell passiveStars">${p.passiveStarRating}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory1]}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory2]}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory3]}</div>
                <div class="passiveTableCell passiveTitle">${p.passiveTitle}</div>
                <div class="passiveTableCell passiveDesc">${p.passiveDescription}</div>
            </div>
            `;
        }).join(""));

        $('.passiveRow').on('click', function(){
            const taskCode = $(this).attr('taskcode');
            let assocPassive = passiveList.filter(p => p.passiveTaskCode == taskCode)[0];

            if(assocPassive){
                if(!assocPassive.completed){
                    if(!assocPassive.planned){
                        markPlanned(assocPassive,true,this);
                        markCompleted(assocPassive,false,this);
                    }
                    else{
                        markPlanned(assocPassive,false,this);
                        markCompleted(assocPassive,true,this);
                    }
                }
                else{
                    markPlanned(assocPassive,false,this);
                    markCompleted(assocPassive,false,this);
                }
                
            }
            else{
                console.error("Row reference to non-existent passive!");
            }
        });

    }

    const markPlanned = (passive, newState, rowElmt) => {
        passive.planned = newState;

        if(rowElmt){
            if(passive.planned){
                $(rowElmt).addClass('planned');
            }
            else{
                $(rowElmt).removeClass('planned');
            }
        }

        const plannedList = passiveList.filter(p => p.planned).map(c => c.passiveTaskCode);
        // console.log(completedList);

        localStorage.setItem('planned-passives',JSON.stringify(plannedList));
        updateProgress();
    }

    const markCompleted = (passive, newState, rowElmt) => {
        passive.completed = newState;

        if(rowElmt){
            if(passive.completed){
                $(rowElmt).addClass('completed');
            }
            else{
                $(rowElmt).removeClass('completed');
            }
        }

        const completedList = passiveList.filter(p => p.completed).map(c => c.passiveTaskCode);
        // console.log(completedList);

        localStorage.setItem('completed-passives',JSON.stringify(completedList));
        updateProgress();
    }

    const sortPassivesBy = (sortType) => {
        if(sortType == "Code"){
            passiveList = passiveList.sort((a,b) => a.passiveTaskCode.localeCompare(b.passiveTaskCode));
        }
        if(sortType == "Stars"){
            passiveList = passiveList.sort((a,b) => a.passiveStarRating - b.passiveStarRating);
        }
        if(sortType == "Early"){
            passiveList = passiveList.sort((a,b) => tierOrder.indexOf(a.passiveCategory1) - tierOrder.indexOf(b.passiveCategory1));
        }    
        if(sortType == "Rec"){
            passiveList = passiveList.sort((a,b) => tierOrder.indexOf(a.passiveCategory2) - tierOrder.indexOf(b.passiveCategory2));
        }
        if(sortType == "Exp"){
            passiveList = passiveList.sort((a,b) => tierOrder.indexOf(a.passiveCategory3) - tierOrder.indexOf(b.passiveCategory3));
        }
        if(sortType == "Title"){
            passiveList = passiveList.sort((a,b) => a.passiveTitle.localeCompare(b.passiveTitle));
        }
        if(sortType == "Description"){
            passiveList = passiveList.sort((a,b) => a.passiveDescription.localeCompare(b.passiveDescription));
        }

        createTable();
    }

    const calculateTierRequirements = () => {
        let tierScores = {
            "Beginner": {partial: 0, full: 0, combined: 0},
            "Easy":  {partial: 0, full: 0, combined: 0},
            "Medium":  {partial: 0, full: 0, combined: 0},
            "Hard":  {partial: 0, full: 0, combined: 0},
            "Elite":  {partial: 0, full: 0, combined: 0},
            "Master":  {partial: 0, full: 0, combined: 0},
            "Legendary":  {partial: 0, full: 0, combined: 0},
            "God": {partial: 0, full: 0, combined: 0}
        }

        const partialWeighting = 0.5;
        const fullWeighting = 1;

        passiveList.forEach(p => {
            if(p.passiveCategory2 != "-"){
                tierScores[p.passiveCategory2].partial += partialWeighting;
            }
            if(p.passiveCategory3 != "-"){
                tierScores[p.passiveCategory3].full += fullWeighting;
            }
        
        });

        for(k in tierScores){
            tierScores[k].combined = tierScores[k].partial + tierScores[k].full;
        }

    
        console.log(tierScores);

        let combinedTierScores = {};
        /*
            Tier "score" is calculated as the sum of all previous tiers' FULL value, plus the PARTIAL and FULL value of the current tier
        */

        for(j in tierScores){ //Iterate through the tiers
            let sum = 0;
            for(k in tierScores){
                sum += tierScores[k].full; //Tier <= than current (j), add full score
                if(j == k){ //Tier equal to current, also add partial and break loop
                    sum += tierScores[k].partial;
                    break;
                }
            }

            combinedTierScores[j] = sum;
        }

        console.log(combinedTierScores);
    }

    const addPassiveToDataBase = (code, title, desc, stars, cat1, cat2, cat3) => {
        $.ajax({
            url: 'addPassiveToDatabase.php',
            method: 'POST',
            data: {
                code: code,
                title: title,
                desc: desc,
                star: stars,
                cat1: cat1.trim(),
                cat2: cat2.trim(),
                cat3: cat3.trim()
            }
        });
    }

    const importCompletions = (list) => {
        if(!(typeof list == "object")){
            list = $.parseJSON(list);
        }

        list.forEach(code => {
            const p = passiveList.filter(passive => passive.passiveTaskCode == code)[0];
            if(p){
                markCompleted(p,true,null);
            }
            
        });

        createTable();
    }

    const importPlans = (list) => {
        if(!(typeof list == "object")){
            list = $.parseJSON(list);
        }

        list.forEach(code => {
            const p = passiveList.filter(passive => passive.passiveTaskCode == code)[0];
            if(p){
                markPlanned(p,true,null);
            }
            
        });

        createTable();
    }

    const updateProgress = () => {
        const progress = {
            planned: passiveList.filter(p => p.planned).length,
            completed: passiveList.filter(p => p.completed).length
        }

        // console.log(progress);

        $('.progressBar').width(`${100*progress.completed/tierRequirements.Completion}%`);
        $('.plannedBar').width(`${100*progress.planned/tierRequirements.Completion}%`);

        Array.from(document.getElementsByClassName('progressMilestone')).forEach(e => {
            let n = $(e).attr('tasksRequired');
            // console.log(n);
            $(e).removeClass('completed');
            $(e).removeClass('planned');
            // console.log(progress.completed >= n);
            if(progress.completed >= n){
                $(e).addClass('completed');
            }
            else if(progress.completed + progress.planned >= n){
                $(e).addClass('planned');
            }
        });
    }

    init();

    


    function querySpotlight(date){
        return (spotlight.getCurrentMinigame(new Date(date).getTime()));
    }

    return{
        importCompletions,
        querySpotlight
    }
}();