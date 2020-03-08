define([
    "gnuplot_update",
    "plot-scripts/utils",
], function(
    GNUPLOT_UPDATE,
    utils
){
//////////////////////////////////////////////////////////////////////////////

var ORDER_OF_STATES = [];
const CUTOFF_DIVISION = 20;



var CUTOFF_STATE = ORDER_OF_STATES[0];

function findCutoffState(data){
    var ts = Object.keys(data);
    ts.sort();
    var d = data[ts[ts.length-1]];
    var cutoffSize = d[ORDER_OF_STATES[0]] / 20;
    for(var i=0; i<ORDER_OF_STATES.length; i++){
        if(d[ORDER_OF_STATES[i]] <= cutoffSize){
            CUTOFF_STATE = ORDER_OF_STATES[i];
            return;
        }
    }
}

function trimStackedRowData(stackedNumbers){
    /*
        Outputs a new row, cut off stacked numbers at TOTAL / 10, counts lower
        then that is replaced by "others"
    */
    var outputRow = {"others": 0};
    var cut = false,
        cutoff = stackedNumbers[ORDER_OF_STATES[0]] / CUTOFF_DIVISION;

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        if(ORDER_OF_STATES[i] == CUTOFF_STATE){
            outputRow["others"] = stackedNumbers[ORDER_OF_STATES[i]];
            break;
        } else {
            outputRow[ORDER_OF_STATES[i]] = stackedNumbers[ORDER_OF_STATES[i]];
        }
    }
    return outputRow;
}




function stackedCSVGen(input){
    /* Format the data collected from project "covid19-eu-data", as:
        datetime,state,total_of_state_1,total_of_state_1+2,total_of_state_1+2+3
    
       which is good for stacked chart.*/

    var data = {};

    ORDER_OF_STATES = [];

    input.split("\n").forEach(function(row){
        var cells = row.trim().split(",");
        if(cells.length < 4) return;

        var datetime = cells[3], statename = cells[1];

        if(statename == "Repatriierte" || statename == "sum" || statename == "state") return;
        statename = utils.normalizeStateName(statename);
        if(!statename) throw Error("State unknown: " + row);
        if(ORDER_OF_STATES.indexOf(statename) < 0){
            ORDER_OF_STATES.push(statename);
        }

        datetime = new Date(datetime + 'Z').getTime() / 1000;
        if(isNaN(datetime)) return;

        if(!data[datetime]) data[datetime] = {};
        data[datetime][statename] = parseInt(cells[2]);
    });

    var timestamps = Object.keys(data);

    timestamps.sort();
    var newestTimestamp = timestamps[timestamps.length-1];

    // determine order of states, lower index -> larger number
    var newestData = data[newestTimestamp];
    ORDER_OF_STATES.sort(function(state1, state2){
        var c1 = (newestData[state1] !== undefined ? newestData[state1] : 0),
            c2 = (newestData[state2] !== undefined ? newestData[state2] : 0);
        return c1 < c2;
    });

    var output = [];
    var cutoffState = findCutoffState(data);

    for(var datetime in data){
        // count stacked numbers for all states
        var stackedNumbers = {};
        var count = 0;
        for(var i=ORDER_OF_STATES.length-1; i>=0; i--){
            count += (data[datetime][ORDER_OF_STATES[i]] || 0);
            stackedNumbers[ORDER_OF_STATES[i]] = count;
        }

        // output a row, with cut-off numbers
        var outputRow = trimStackedRowData(stackedNumbers);

        // write a line to output
        var outputRowStr = datetime.toString();
        outputRowStr += "," + outputRow["others"];
        for(var i=0; i<ORDER_OF_STATES.length; i++){
            outputRowStr += "," + (outputRow[ORDER_OF_STATES[i]] !== undefined ? outputRow[ORDER_OF_STATES[i]] : "x");
        }
        output.push(outputRowStr);

    }

    return output.join("\n");
    // Germany have 16 federal states:
    //    datetime,others,sum_of_1-16,sum_of_1-15,sum_of-1-14,...
}




async function doPlot(url, countryName){
    utils.getColor.reset();
    
    const dataset = await $.get(url);

    const files = {
        // data files being fed to GNUPLOT
        "data.csv": stackedCSVGen(dataset)
    };


    var instruction = `
        set terminal svg size 600,400 enhanced fname 'arial'  fsize 10 butt solid
        set output 'out.svg'

        set datafile separator ","

        set timefmt "%s"
        set xdata time
        set format x "%m月\\n%d日"
        set style fill solid 1.0

        set key left nobox noopaque noautotitle maxrows 4
        set ytics mirror
        set y2tics
        set grid ytics xtics
        set grid front
    `;
    instruction += "set title \"" + countryName + "各州 COVID-19 感染人数\"\n";

    var plotcmd = [];

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        plotcmd.push([
            "\"data.csv\"",
            "using 1:" + (i+3) + " with filledcurves x1",
            "lc rgb '" + utils.getColor() + "'",
            "title \"" + ORDER_OF_STATES[i] + "\"",
        ].join(" "));
    }
    plotcmd.push([
        "\"data.csv\"",
        "using 1:2 with filledcurves x1",
        "lc rgb '#CCCCCC'",
        "title \"其他\"",
    ].join(" "));

    instruction += "plot " + plotcmd.join(", ");


    console.log(instruction);
    
    GNUPLOT_UPDATE(files, instruction); 
};


return function(PLOTS){
    PLOTS["德国感染人数统计图(堆积)"] = async () => await doPlot(
        "https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-de.csv",
        "德国"
    );

    PLOTS["奥地利感染人数统计图(堆积)"] = async () => await doPlot(
        "https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv",
        "奥地利"
    );
};



//////////////////////////////////////////////////////////////////////////////
});
