const TaskmanPassives = function(){
    let passiveList = [];

    const tierAbbreviations = {
        "-": "-",
        Tutorial: "TUT",
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
        // Beginner: 25,
        // Easy: 70,
        // Medium: 125,
        // Hard: 230,
        // Elite: 365,
        // Master: 515,
        // Legendary: 610,
        // God: 727
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
            let offset = daysDiff%3;
            console.log(rotationSteps,offset);

            let currentSpotlightStart = Date.now() - offset*(1000*60*60*24);
            console.log(new Date(currentSpotlightStart));
            return {
                current: {
                    minigame: spotlight.minigames[rotationSteps%27],
                    start: Date.now() - offset*(1000*60*60*24),
                    end: Date.now() - offset*(1000*60*60*24) + 3*(1000*60*60*24)
                },
                next1: {
                    minigame: spotlight.minigames[(rotationSteps+1)%27],
                    start: Date.now() - offset*(1000*60*60*24) + 3*(1000*60*60*24),
                    end: Date.now() - offset*(1000*60*60*24) + 6*(1000*60*60*24)
                },
                next2: {
                    minigame: spotlight.minigames[(rotationSteps+2)%27],
                    start: Date.now() - offset*(1000*60*60*24) + 6*(1000*60*60*24),
                    end: Date.now() - offset*(1000*60*60*24) + 9*(1000*60*60*24)
                },
            }
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
            const a = confirm("Importing completed tasks will clear all tasks currently marked as completed. Any tasks marked as planned will be cleared. Continue?");

            if(!a) return;

            console.log("Clearing and importing tasks!");

            passiveList.forEach(p => {
                markPlanned(p,false,null);
            });
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
  
    const getSitePassiveRequirements = () => {
        $.ajax({
            url: 'https://taskman.rs/api/tiers',
            dataType: 'JSON',
            success: function(data){
                console.log(data);

                data.forEach(tier => {
                    if(tier.id >= 8 || tier.id == 1) return;

                    let tierReq = tier.passives_needed;
                    tierRequirements[tierOrder[tier.id-2]] = tierReq;
                });

                console.log(tierRequirements);
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

    const getPassiveList = () => {
        $.ajax({
            url: 'Passive Tool Update - Passive Table.tsv',
            method: 'GET',
            success: function(data){
                

                data = data.split("\n").slice(1).map((row,idx) => {
                    let cells = row.split("\t");

                    let item = {
                        passiveTaskCode: cells[0],
                        passiveStarRating: cells[3],
                        passiveCategory1: cells[4],
                        passiveCategory2: cells[5],
                        passiveCategory3: cells[6],
                        passiveTitle: cells[1],
                        passiveDescription: cells[2],
                        passivePlacementReason: cells[7]=="NULL\r"?"":cells[7],
                        enabled: 1
                    }

                    return item;
                });

                console.log(data);

                // return;
                data = data.filter(d => d.enabled == 1);
                passiveList = data;

                tierRequirements.Completion = passiveList.length;                
                tierRequirements.God = passiveList.length;                
                
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
            }
        });
    }

    getSitePassiveRequirements();
    getPassiveList();

    const createTable = () => { //

        $('.passiveTable').html(passiveList.map((p,i) => {
            if(p.passiveTitle == undefined) return ``;
            return `
            <div class="passiveRow ${i%2==0?"even":"odd"} ${p.planned?"planned":""} ${p.completed?"completed":""}" taskcode="${p.passiveTaskCode}">
                <div class="passiveTableCell passiveCode">${p.passiveTaskCode}</div>
                <div class="passiveTableCell passiveStars">${p.passiveStarRating}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory1]}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory2]}</div>
                <div class="passiveTableCell passiveCategory">${tierAbbreviations[p.passiveCategory3]}</div>
                <div class="passiveTableCell passiveTitle">${p.passiveTitle}</div>
                <div class="passiveTableCell passiveDesc">${p.passiveDescription}</div>
                <div class="passiveTableCell passiveDesc">${p.passivePlacementReason || ""}</div>
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
        console.log("Calculating tier requirements");
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

        const partialWeighting = 0.4;
        const fullWeighting = 1;

        console.log(passiveList.length);
        console.log("---");
        passiveList.forEach((p,index) => {
            try{
                if(p.passiveCategory2 != "-" && p.passiveCategory2 != ""){
                    tierScores[p.passiveCategory2.trim()].partial += partialWeighting;
                }
                if(p.passiveCategory3 != "-" && p.passiveCategory3 != ""){
                    tierScores[p.passiveCategory3.trim()].full += fullWeighting;
                }
            }
            catch(err){
                console.log(err);
                console.log(p);

            }
        
        });
        console.log("---");
        for(k in tierScores){
            tierScores[k].combined = tierScores[k].partial + tierScores[k].full;
        }
        console.log("---");
    
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

        for(k in combinedTierScores){
            combinedTierScores[k] = `${combinedTierScores[k]} (${tierRequirements[k]})`;
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

    function compareList(inputData){
        let comparison = {
            both: [],
            input: [],
            list: []
        }

        const d = typeof inputData == "object"?inputData:$.parseJSON(inputData);
        d.forEach(task => {
            const title = task.title;
            const inList = passiveList.filter(passive => passive.passiveTitle == title)[0];
            if(!inList){
                comparison.input.push(task.title);
            }
            else{
                comparison.both.push(task.title);
            }
        });

        passiveList.forEach(passive => {
            const title = passive.passiveTitle;
            const inInput = d.filter(task => task.title == title)[0];
            if(!inInput){
                comparison.list.push(passive.passiveTitle);
            }
            else{
                comparison.both.push(passive.passiveTitle);
            }
        });

        console.log(comparison);
    }

    return{
        importCompletions,
        querySpotlight,
        compareList
    }
}();
