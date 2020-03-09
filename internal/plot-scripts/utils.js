define([], function(){
//////////////////////////////////////////////////////////////////////////////
var ret = {};


function normalizeStateName(n){
    n = n.replace("-", "").replace(/\s/g, "").toLowerCase();
    n = n.replace("ü", "ue").replace("ä", "ae").replace("ö", "oe");
    return {
        // Deutschland
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

        // Oesterreich
        "vorarlberg": "Vorarlberg",
        "kaernten": "Kärnten",
        "burgenland": "Burgenland",
        "oberoesterreich": "Oberösterreich",
        "niederoesterreich": "Niederösterreich",
        "wien": "Wien",
        "tirol": "Tirol",
        "salzburg": "Salzburg",
        "steiermark": "Steiermark",

        // Italiy
        "abruzzo": "Abruzzo",
        "basilicata": "Basilicata",
        "bolzano": "Bolzano",
        "calabria": "Calabria",
        "campania": "Campania",
        "emiliaromagna": "Emilia Romagna",
        "friuliveneziagiulia": "Friuli Venezia Giulia",
        "lazio": "Lazio",
        "liguria": "Liguria",
        "lombardia": "Lombardia",
        "marche": "Marche",
        "molise": "Molise",
        "piemonte": "Piemonte",
        "puglia": "Puglia",
        "sardegna": "Sardegna",
        "sicilia": "Sicilia",
        "toscana": "Toscana",
        "trento": "Trento",
        "umbria": "Umbria",
        "valled'aosta": "Valle d'Aosta",
        "veneto": "Veneto",
        

    }[n];
};
ret.normalizeStateName = normalizeStateName;


var colorId = -1;
function getColor(){
    const colors = [
        "#FF0000",
        "#00FF00",
        "#9900FF",
        "#DDAA00",
        "#0000FF",
        "#00FFFF",
        "#FF00FF",
        "#FF9900",
    ];
    colorId += 1;
    return colors[colorId % colors.length];
}
getColor.reset = function(){ colorId = -1 };
ret.getColor = getColor;



ret.parseCasesOfStatesCSV = function(csvdata, format){
    // Parse a csv and returns
    //    [ data[datetime][statename] := number, [statenames]  ]
    // `format` is dependent upon csv source:
    //   1. `covid19-eu-zh`: our own data format
    //   2. `pcm-dpc`: https://github.com/pcm-dpc/COVID-19/tree/master/dati-province
    const data = {}, states = [];


    if("covid19-eu-zh" == format){
        function onRow(row){
            var cells = row.trim().split(",");
            if(cells.length < 4) return;

            var datetime = cells[3], statename = cells[1];

            if(statename == "Repatriierte" || statename == "sum" || statename == "state") return;
            statename = normalizeStateName(statename);
            if(!statename) throw Error("State unknown: " + row);
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            if(!data[datetime]) data[datetime] = {};
            data[datetime][statename] = parseInt(cells[2]);
        }
        
    } else if ("pcm-dpc" == format) {
        function onRow(row){
            var cells = row.trim().split(",");
            if(cells.length < 4) return;

            var datetime = cells[0], statename = cells[3];

            if(statename == "denominazione_regione") return;
            statename = normalizeStateName(statename);
            if(!statename) throw Error("State unknown: " + row);
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            if(!data[datetime]) data[datetime] = {};
            if(undefined === data[datetime][statename]){
                data[datetime][statename] = 0;
            }
            data[datetime][statename] += parseInt(cells[9]);
        }

    } else {
        throw Error("Unknown format specification.");
    }
    csvdata.split("\n").forEach(onRow);
    return [data, states];
}




return ret;
//////////////////////////////////////////////////////////////////////////////
});
