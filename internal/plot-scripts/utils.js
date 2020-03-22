define([
    "papaparse.min",
    "./zones.nl"
], function(
    papa, // CSV parser
    zonesNL
){
//////////////////////////////////////////////////////////////////////////////
var ret = {};


function normalizePlaceName(n){
    n = n.replace(/[^0-9a-zA-ZäüößÎôéâ\(\)]/g, "");
    //n = n.replace(/[\-\._'’\,"]/g, "").replace(/\s/g, "");
    n = n.replace("ü", "ue").replace("ä", "ae").replace("ö", "oe");
    n = n.replace("Î", "I").replace(/ô/g, "o").replace(/é/g, "e");
    n = n.replace(/â/g, "a");
    n = n.toLowerCase();
    return n;
}

function normalizeStateName(n){
    n = normalizePlaceName(n);
    console.debug(n);
    const map = {
        // Special, often ignored
        "sum": "sum",
        "repatriierte": "Repatriierte",
        "oversea": "Oversea",
        "metropolis": "Metropolis",
        "other": "Other",


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

        // Schweiz
        "nw": "Nidwalden",
        "ow": "Obwalden",
        "sh": "Schaffhausen",
        "ur": "Uri",
        "gl": "Glarus",
        "ai": "Appenzell Innerrhoden",
        "ar": "Appenzell Ausserrohden",
        "tg": "Thurgau",
        "ju": "Jura",
        "sg": "St. Gallen",
        "so": "Solothurn",
        "lu": "Luzern",
        "vs": "Wallis",
        "zg": "Zug",
        "fr": "Freiburg",
        "sz": "Schwyz",
        "ne": "Neuenburg",
        "bl": "Basel-Landschaft",
        "ag": "Aargau",
        "gr": "Graubünden",
        "ge": "Genf",
        "bs": "Basel-Stadt",
        "be": "Bern",
        "vd": "Waadt",
        "zh": "Zürich",
        "ti": "Tessin",


        // Italy
        "abruzzo": "Abruzzo",
        "basilicata": "Basilicata",
        "pabolzano": "Bolzano",
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
        "patrento": "Trento",
        "trento": "Trento",
        "umbria": "Umbria",
        "valledaosta": "Valle d'Aosta",
        "veneto": "Veneto",

        // France
        "auvergnerhonealpes": "Auvergne-Rhône-Alpes",
        "bourgognefranchecomte": "Bourgogne-Franche-Comté",
        "bretagne": "Bretagne",
        "centrevaldeloire": "Centre-Val de Loire",
        "corse": "Corse",
        "grandest": "Grand Est",
        "hautsdefrance": "Hauts-de-France",
        "iledefrance": "Île-de-France",
        "normandie": "Normandie",
        "nouvelleaquitaine": "Nouvelle-Aquitaine",
        "occitanie": "Occitanie",
        "paysdelaloire": "Pays de la Loire",
        "provencealpescotedazur": "Provence-Alpes-Côte d'Azur",
        "mayotte": "Mayotte",
        "lareunion": "La Réunion",
        "guadeloupe": "Guadeloupe",
        "saintbarthelemy": "Saint-Barthélémy",
        "saintmartin": "Saint-Martin",
        "martinique": "Martinique",
        "guyane": "Guyane",

        // Netherlande
        "nuenengerwenennederwetten": "Nuenen, Gerwen en Nederwetten",
        "bergen(l)": "Limburg",
        "hengelo(o)": "Overijssel",
        "sgravenhage": "Zuid-Holland",
        "bergen(nh)": "Noord-Holland",
    };
    for(var admin in zonesNL){
        zonesNL[admin].forEach(function(city){
            map[normalizePlaceName(city)] = admin;
        });
    }

    return map[n];
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




/*function getCounter(){
    var sum = 0;
    function counterCaller(add){
        if(undefined === add) return sum;
        sum += add;
        return sum;
    }
    return counterCaller;
}*/

async function readCSVWithHeader(csvdata, options, onRow){
    return new Promise(function(resolve, reject){
        papa.parse(csvdata, {
            header: true,
            step: onRow,
            complete: resolve,
        });
    });
}

ret.parseCasesOfStatesCSV = async function(csvdata, format){
    // Parse a csv and returns
    //    [ data[datetime][statename] := number, [statenames]  ]
    // `format` is dependent upon csv source:
    //   1. `covid19-eu-zh`: our own data format
    //   2. `pcm-dpc`: https://github.com/pcm-dpc/COVID-19/tree/master/dati-province
    const dataCases = {}, states = [], dataDeaths = {};

    function addCount(obj, datetime, statename, number){
        if(!obj[datetime]) obj[datetime] = {};
        if(obj[datetime][statename] === undefined) obj[datetime][statename] = 0;
        obj[datetime][statename] += number;
    }

    var isOurFormat = /^covid19-eu-zh(@([a-z_0-9]+))?$/.exec(format);
    if(isOurFormat){
        var unknownStates = [];

        function onRow(cells){
            cells = cells.data;
            console.log(cells);

            var placeIdentifier = isOurFormat[2];
            if(placeIdentifier === undefined) placeIdentifier = ["state"];

            var statename0 = cells[placeIdentifier], statename;

            var datetime = cells["datetime"],
                casescount = parseInt(cells["cases"]),
                deathscount = parseInt(cells["deaths"]);

            if(datetime === undefined || casescount === undefined) return;

            statename = normalizeStateName(statename0);
            if(!statename){
                throw Error("Unknown state: " + statename0 + " @ " + JSON.stringify(cells));
                if(unknownStates.indexOf(statename0) < 0) unknownStates.push(statename0);
                statename = "???";
            }
            if([
                "Repatriierte", "Metropolis", "Oversea", "sum", "Other",
            ].indexOf(statename) >= 0) return;
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            /*if(!dataCases[datetime]) data[datetime] = {};
            dataCases[datetime][statename] = casescount;*/
            addCount(dataCases, datetime, statename, casescount);
        }
        await readCSVWithHeader(csvdata, ",", onRow);
        console.info("Following states unknown:");
        console.info(unknownStates);
        
    } else if ("pcm-dpc" == format) {
        function onRow(cells){
            cells = cells.data;

            var datetime = cells["data"],
                statename = cells["denominazione_regione"],
                casescount = parseInt(cells["totale_casi"]),
                deathscount = parseInt(cells["deceduti"]);

            if(datetime === undefined || statename === undefined) return;

            statename = normalizeStateName(statename);
            if(!statename) throw Error("State unknown: " + JSON.stringify(cells));
            if(states.indexOf(statename) < 0) states.push(statename);

            datetime = new Date(datetime + 'Z').getTime() / 1000;
            if(isNaN(datetime)) return;

            /*if(!data[datetime]) data[datetime] = {};
            if(undefined === data[datetime][statename]){
                dataCases[datetime][statename] = 0;
            }
            dataCases[datetime][statename] += casescount;*/
            addCount(dataCases, datetime, statename, casescount);
            addCount(dataDeaths, datetime, statename, deathscount);
        }
        console.debug(dataDeaths);
        await readCSVWithHeader(csvdata, ",", onRow);

    } else {
        throw Error("Unknown format specification.");
    }
    return {
        cases: dataCases,
        deaths: dataDeaths,
        states: states,
    };
}




return ret;
//////////////////////////////////////////////////////////////////////////////
});
