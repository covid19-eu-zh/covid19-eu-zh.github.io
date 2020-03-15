define([], function(){
//////////////////////////////////////////////////////////////////////////////
var ret = {};


function normalizePlaceName(n){
    n = n.replace(/[\-_"]/g, "").replace(/\s/g, "");
    n = n.replace("ü", "ue").replace("ä", "ae").replace("ö", "oe");
    n = n.replace("Î", "I");
    n = n.toLowerCase();
    return n;
}

function normalizeStateName(n){
    n = normalizePlaceName(n);
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
        "p.a.bolzano": "Bolzano",
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
        "p.a.trento": "Trento",
        "trento": "Trento",
        "umbria": "Umbria",
        "valled'aosta": "Valle d'Aosta",
        "veneto": "Veneto",
        

    }[n];
};
ret.normalizeStateName = normalizeStateName;



function franceDepartementToRegion(detail){
    const regions = {
        "Auvergne-Rhône-Alpes": [
            "Ain", "La Balme-de-Sillingy", "Haute-Savoie",
        ],
        "Bourgogne-Franche-Comté": [
            "Dijon",
        ],
        "Bretagne": [
        ],
        "Centre-Val de Loire": [
        ],
        "Corse": [
            "Corse-du-Sud",
        ],
        "Grand Est": [
        ],
        "Hauts-de-France": [
            "Aisne", "Oise",
        ],
        "Île-de-France": [
            "Paris", "Essonne",
        ],
        "Normandie": [
            "Seine-Maritime",
        ],
        "Nouvelle-Aquitaine": [
        ],
        "Occitanie": [
        ],
        "Pays de la Loire": [
            "Maine-et-Loire",
        ],
        "Provence-Alpes-Côte d'Azur": [
            "Var", "Nice", "Alpes-Maritimes",
        ],
    };
    var regionsNormalized = {};
    Object.keys(regions).forEach(function(r){
        regionsNormalized[normalizePlaceName(r)] = r;
        for(var i=0; i<regions[r].length; i++){
            regions[r][i] = normalizePlaceName(regions[r][i]);
        }
    });

    var place = detail.split(":")[0].trim(),
        placeN = normalizePlaceName(place);
    if(regionsNormalized[placeN] !== undefined){
        return regionsNormalized[placeN];
    }

    for(var region in regions){
        if(regions[region].indexOf(placeN) >= 0) return region;
    }
    

    console.log(place);
}










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






function readCSVWithHeader(csvdata, splitter){
    if(!splitter) splitter = ",";
    const ret = [];
    lines = csvdata.split("\n");
    headers = null;
    lines.forEach(function(line){
        if(!line.trim()) return;
        var cells = line.split(splitter);
        if(!headers){
            headers = cells;
        } else {
            var x = {};
            for(var i=0; i<cells.length; i++){
                x[headers[i]] = cells[i];
            }
            ret.push(x);
        }
    });
    return ret;
}

ret.parseCasesOfStatesCSV = function(csvdata, format){
    // Parse a csv and returns
    //    [ data[datetime][statename] := number, [statenames]  ]
    // `format` is dependent upon csv source:
    //   1. `covid19-eu-zh`: our own data format
    //   2. `pcm-dpc`: https://github.com/pcm-dpc/COVID-19/tree/master/dati-province
    const data = {}, states = [];

    if("covid19-eu-zh" == format){
        function onRow(cells){
            var datetime = cells["datetime"],
                statename = cells["state"]
                casescount = parseInt(cells["cases"]);

            if(statename == "Repatriierte" || statename == "sum" || statename == "state") return;
            statename = normalizeStateName(statename);
            if(!statename) throw Error("State unknown: " + row);
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            if(!data[datetime]) data[datetime] = {};
            data[datetime][statename] = casescount;
        }
        readCSVWithHeader(csvdata, ",").forEach(onRow);
        
    } else if ("pcm-dpc" == format) {
        function onRow(cells){
            var datetime = cells["data"],
                statename = cells["denominazione_regione"],
                casescount = parseInt(cells["totale_casi"]);

            if(statename == "denominazione_regione") return;
            statename = normalizeStateName(statename);
            if(!statename) throw Error("State unknown: " + JSON.stringify(cells));
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            if(!data[datetime]) data[datetime] = {};
            if(undefined === data[datetime][statename]){
                data[datetime][statename] = 0;
            }
            data[datetime][statename] += casescount;
        }
        readCSVWithHeader(csvdata, ",").forEach(onRow);

    } else if ("lefigaro.fr" == format){
        var deltas = {};

        function onDayDelta(row){
            var cells = row.trim().split(";");
            if(cells.length < 6) return;
            
            var date = cells[2], detail = cells[4];
            if(detail == "detail") return;
            var region = franceDepartementToRegion(detail);
            var count = parseInt(cells[3]);

            var datetime = new Date(
                "2020-" + date.slice(-2) + "-" + date.slice(0,2)
            ).getTime() / 1000;
            if(states.indexOf(region) < 0) states.push(region);

            if(!deltas[datetime]) deltas[datetime] = {};
            if(undefined == deltas[datetime][region]){
                deltas[datetime][region] = 0;
            }
            deltas[datetime][region] += count;
        }
        csvdata.split("\n").forEach(onDayDelta);

        // cumulate cases from daily deltas

        var datetimes = Object.keys(deltas);
        datetimes.sort(); // earlier -> later
        var snapshot = {}; // cumulated cases for a given time
        states.forEach(function(region){ snapshot[region] = 0 });
        datetimes.forEach(function(datetime){
            data[datetime] = {};
            for(var region in deltas[datetime]){
                snapshot[region] += deltas[datetime][region];
                data[datetime][region] = snapshot[region];
            }
        });

        console.log(data, states);

    } else {
        throw Error("Unknown format specification.");
    }
    return [data, states];
}




return ret;
//////////////////////////////////////////////////////////////////////////////
});
