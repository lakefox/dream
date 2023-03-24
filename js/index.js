function getPost() {
    let url = document.querySelector("#postURL").value;
    url = url.replace("https://decode.sh/", "https://decode.sh/raw/");

    fetch(`https://cors.lowsh.workers.dev/?${url}`).then(e => e.json()).then((data) => {
        console.log(data);
        parse(data);
    })
}

function parse(data) {
    let content = data.content.split("\n").filter(e => e != "");
    let pages = [{ title: false, lines: [] }];
    for (let i = 0; i < content.length; i++) {
        if (content[i].slice(0, 4) == "### ") {
            pages.push({
                title: content[i].slice(4).trim(),
                lines: []
            });
        } else {
            let images = (content[i]
                .match(/!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<optionalpart>\".*\")?\)/g) || [])
                .map((e) => {
                    let a = e.slice(2, -1).split('](');
                    return { name: a[0], url: a[1] };
                });
            if (images.length > 0) {
                if (pages[pages.length - 1].images == undefined) {
                    pages[pages.length - 1].images = []
                }
                pages[pages.length - 1].images.push(...images);
                content[i] = content[i].replace(/!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<optionalpart>\".*\")?\)/g, "");
            }
            if (content[i].trim() != "") {
                pages[pages.length - 1].lines.push(content[i]);
            }
        }
    }
    if (pages[0].title == "" && pages[0].lines.length == 0) {
        pages.shift();
    }
    posts(pages);
}

function posts(pages) {
    hide("#qs");
    show("#posts");
    console.log(pages);
    let all = powerSet(pages);
    let store = [];
    let logoImage = new Image();
    logoImage.onload = ()=>{
        for (let a = 0; a < all.length; a++) {
            const posts = all[a];
            console.log(posts);
            let canvas = document.createElement("canvas");
            document.querySelector("#images").appendChild(canvas);
            let d = new Draft();
            let can = document.querySelector("#images").children[document.querySelector("#images").children.length - 1];
            d.init(can, can.getContext("2d"), 1080, 1080, "#000");
            d.image("logo", logoImage, 1030, 930, 50, 150);
            for (let b = 0; b < posts.length; b++) {
                const post = posts[b];
                header(d, b, 200*b, post.title, 100);
            }
            d.draw();
            store.push(canvas);
        }
    }
    logoImage.src = "https://api.low.sh/api/files/4z6s7kmtcmrmcd9/9shvjd8d8vqniet/favicon_48cIXA3wgd.png";
}

function header(d, index, yoffset, text, size) {
    let width = d.measureText(text, `${size}px 'Arial Black'`);
    if (width.width > 780) {
        for (let i = size; size > 0; i--) {
            size = i;
            width = d.measureText(text, `${size}px 'Arial Black'`);
            if (width.width < 780) {
                break;
            }
        }
    }
    d.text("h"+index, text, 100, 200+yoffset, `${size}px 'Arial Black'`, "#fff");
    d.rect("hl"+index, 100, 235+yoffset, Math.min(text.length*size, 880), 20, "#fff");
    return size;
}

function paragraph(d, index, yoffset, text, size) {

}

function hide(el) {
    document.querySelector(el).style.display = "none";
}

function show(el) {
    document.querySelector(el).style.display = "block";
}

function powerSet(list) {
    var set = [],
        listSize = list.length,
        combinationsCount = (1 << listSize),
        combination;

    for (var i = 1; i < combinationsCount; i++) {
        var combination = [];
        for (var j = 0; j < listSize; j++) {
            if ((i & (1 << j))) {
                combination.push(list[j]);
            }
        }
        set.push(combination);
    }
    return set;
}