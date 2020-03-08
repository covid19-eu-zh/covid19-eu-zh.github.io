(function(){
//////////////////////////////////////////////////////////////////////////////

const ORDER_OF_STATES = [
    // hardcoded display order
    "Nordrhein-Westfalen",
    "Baden-Württemberg",
    "Bayern",
    "Berlin",
    "Niedersachsen",
    "Hessen",
    "Rheinland-Pfalz",
    "Hamburg",
    "Schleswig-Holstein",
    "Mecklenburg-Vorpommern",
    "Brandenburg",
    "Bremen",
    "Saarland",
    "Sachsen",
    "Thüringen",
    "Sachsen-Anhalt",
];

function normalizeStateName(n){
    n = n.replace("-", "").replace(" ", "").toLowerCase();
    n = n.replace("ü", "ue");
    return {
        "nordrheinwestfalen": "Nordrhein-Westfalen",
        "badenwuerttemberg" : "Baden-Württemberg",
        "bayern": "Bayern",
        "berlin": "Berlin",
        "niedersachsen": "Niedersachsen",
        "brandenburg": "Brandenburg",
        "bremen": "Bremen",
        "hamburg": "Hamburg",
        "hessen": "Hessen",
        "mecklenburgvorpommern": "Mecklenburg-Vorpommern",
        "rheinlandpfalz": "Rheinland-Pfalz",
        "saarland": "Saarland",
        "sachsen": "Sachsen",
        "schleswigholstein": "Schleswig-Holstein",
        "thueringen": "Thüringen",
        "sachsenanhalt": "Sachsen-Anhalt",
    }[n];
}



function CSVGen(input){
    var data = {};

    var MAX = 0;

    input.split("\n").forEach(function(row){
        var cells = row.trim().split(",");
        if(cells.length < 4) return;

        var datetime = cells[3], statename = cells[1];

        if(statename == "Repatriierte" || statename == "sum" || statename == "state") return;
        statename = normalizeStateName(statename);
        if(!statename) throw Error("State unknown: " + row);

        datetime = new Date(datetime + 'Z').getTime() / 1000;
        if(isNaN(datetime)) return;

        if(!data[datetime]) data[datetime] = {};
        data[datetime][statename] = parseInt(cells[2]);

        if(!isNaN(data[datetime][statename])){
            if(MAX < data[datetime][statename]){
                MAX = data[datetime][statename];
            }
        }
    });

    var timestamps = Object.keys(data);
    timestamps.sort();
    var newestTimestamp = timestamps[timestamps.length-1];


    var output = [];

    for(var datetime in data){
        // write a line to output
        var outputRowStr = datetime.toString();
        for(var i=0; i<ORDER_OF_STATES.length; i++){
            if(data[newestTimestamp][ORDER_OF_STATES[i]] < MAX / 20){
                outputRowStr += ",x";
            } else {
                outputRowStr += "," + data[datetime][ORDER_OF_STATES[i]];
            }
        }
        output.push(outputRowStr);

    }

    return output.join("\n");
    // Germany have 16 federal states:
    //    datetime,state_1,state_2,...
}






PLOTS["德国感染人数统计图(Y-对数)"] = async function(){
    
    const dataset = await $.get("https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-de.csv");

    const files = {
        // data files being fed to GNUPLOT
        "data.csv": CSVGen(dataset)
    };


    var instruction = `
        set terminal svg size 600,400 enhanced fname 'arial'  fsize 10 butt solid
        set output 'out.svg'

        set datafile separator ","

        set title "德国各州 COVID-19 感染人数"
        set timefmt "%s"
        set xdata time
        set format x "%m月\\n%d日"
        set style fill solid 1.0

        set grid mytics xtics
        set mytics 10

        set logscale y

        set key outside center right
    `;

    var plotcmd = [];

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        plotcmd.push([
            "\"data.csv\"",
            "using 1:" + (i+2) + " with lines",
            "title \"" + ORDER_OF_STATES[i] + "\"",
        ].join(" "));
    }

    instruction += "plot " + plotcmd.join(", ");


    console.log(instruction);
    
    GNUPLOT_UPDATE(files, instruction); 
};






//////////////////////////////////////////////////////////////////////////////
})();
