import * as BASEDATA from "../../src/data_manager/bd.js";
import * as USERDATA from "../../src/data_manager/ud.js";

/** Si un template nécessite des données de BASEDATA, appeler la variable suivante (avec un await): */
const dataReady = new Promise(async (res, rej) => {
    if(BASEDATA.flags.loaded) res();
    BASEDATA.onload(res);
})

export const parcours = async (template) => {
    const hash = window.location.hash.substring(1);
    const splitted = hash.split(".");
    let parcours = splitted[1];
    if(splitted[2]) {
        parcours += "#" + splitted[2];
    }
    return _.template(template)({id: parcours});
}

const parcours_map = async (mapid) => {
    const map = L.map(mapid, {
        center: [48.856614, 2.3522219],
        zoom: 13,
        layers: [
            L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            })
        ],
    });
    const code = location.hash.split(".")[1];
    const {parcours} = USERDATA.fromParcode(code);
    const markers = [];
    for(let i = 0; i < parcours.length; i++) {
        const data = await USERDATA.parseId(parcours[i]);
        const marker = L.geoJSON(data.geo);
        marker.bindPopup(L.popup({
            closeButton: false
        }).setContent(data.nom));
        markers.push(marker);
    }
    const group = L.featureGroup(markers).addTo(map);
    map.fitBounds(group.getBounds());
}

export const parcode_test = async (template) => {
    const code = location.hash.split(".")[1];
    return _.template(template)({code});
}
export const parcode = async () => {
    parcours_map("map-parcours");
    $("#share-parcode").on("click", () => {
        const code = location.hash.split(".")[1];
        const {name, img, parcours} = USERDATA.fromParcode(code);
        const url = `${window.location.origin}/parcours#preview.${code}`;
        // it's a share button
        navigator.share({
            title: name,
            text: `${name} (${parcours.length} étapes)`,
            url: url
        });
    });
}

export const preview_content = async (template) => {
    const code = location.hash.split(".")[1];
    const {name, img, parcours} = USERDATA.fromParcode(code);
    return _.template(template)({
        titre: name,
        image: img,
        id: `parcode.${code}`,
    });
}
export const preview_button = async () => {
    parcours_map("map-preview");
}

export const liste = async (template) => {
    const page = location.hash.split(".")[1];
    const el_t = await fetch("pages/parcourir/template/liste_el.html").then(res => res.text());
    let content = "";
    if(page === "my") {
        const my_parcours = USERDATA.getParcours();
        for(let parcours of my_parcours) {
            const data = {
                id: `parcode.${USERDATA.getParcode(parcours.id)}`,
                titre: parcours.name,
                image: 'assets/img/parcours.jpg'
            };
            const html = _.template(el_t)(data);
            content += html;
        }
    } else {
        const config = await fetch("pages/parcourir/parcours.json").then(res => res.json());
        for(let key in config) {
            const json = config[key];
            const data = {
                id: `parcours.${key}`,
                titre: json.titre,
                image: json.visuel
            };
            const html = _.template(el_t)(data);
            content += html;
        }
    }
    return _.template(template)({content: content});
}

export const editorlist = async (template) => {
    const parcoursitem_ = await fetch("pages/parcourir/template/parcoursitem.html").then(res => res.text());
    const parcoursitem = _.template(parcoursitem_);
    const parcours = USERDATA.getParcours();
    let content = "";
    content += parcoursitem({id: "new"});
    for(let key in parcours) {
        const p = parcours[key];
        const data = {
            id: p.id,
            name: p.name,
            etapes: `${p.parcours.length} étapes`
        };
        const html = parcoursitem(data);
        content += html;
    }
    return _.template(template)({content: content});
}
export const editorlist_handler = async (template) => {
    $(".parcoursitem").each(function() {
        const $parcours = $(this);
        $(this).find(".parcoursitem__delete").on("click", function(e) {
            e.stopPropagation();
            const is_sure = confirm("Êtes-vous sûr de vouloir supprimer ce parcours ?");
            if(is_sure) {
                const id = $parcours.data("id");
                USERDATA.removeParcours(id);
                $parcours.remove();
            }
        })
    });
}

export { editor } from "./to-use-editor.js";
