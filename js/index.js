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
            console.log(posts, a);
            let canvas = document.createElement("canvas");
            canvas.onclick = (e) => {
                e.srcElement.classList.toggle("big");
            }
            document.querySelector("#images").appendChild(canvas);
            let d = new Draft();
            let can = document.querySelector("#images").children[document.querySelector("#images").children.length - 1];
            d.init(can, can.getContext("2d"), 1080, 1080, "#000");
            d.image("logo", logoImage, 1030, 930, 50, 150);
            
            doc(d, posts, 100, 100, 880, 880);


            d.draw();
            store.push(canvas);
        }
    }
    logoImage.src = "https://api.low.sh/api/files/4z6s7kmtcmrmcd9/9shvjd8d8vqniet/favicon_48cIXA3wgd.png";
}

function header(d, index, yoffset, width, text, size) {
    
    d.text("h"+index, text, 100, yoffset, `${size}px 'Arial Black'`, "#fff");
    let lineSize = parseInt(size/5);
    d.rect("hl"+index, 100, lineSize+5+yoffset, Math.min(text.length*size, width), lineSize, "#fff");
    return yoffset + size + lineSize;
}

function h(max, num) {
    return (max/6)*num;
}

function paragraph(d, text, width, height) {
    let lines = [];
    let size = 50;
    
    for (let a = size; a > 0; a--) {
        lines = [];
        let current = "";
        for (let i = 0; i < text.length; i++) {
            let mt = d.measureText(current, `${a}px 'Arial Black'`).width;
            if (mt > width) {
                if (current[current.length-1] != " ") {
                    lines.push(current.slice(0,current.lastIndexOf(" ")).trim());
                    current = current.slice(current.lastIndexOf(" "));
                } else {
                    lines.push(current.trim());
                    current = "";
                }
            }
            current += text[i];
        }
        lines.push(current.trim());
        if ((lines.length*a) < height) {
            size = parseInt(a);
            break;
        }
    }
    lines = lines.filter(e=>e!="");
    return {lines, size};
}

function hide(el) {
    document.querySelector(el).style.display = "none";
}

function show(el) {
    document.querySelector(el).style.display = "block";
}

function getMax(d, text, maxWidth, size) {
    let width = d.measureText(text, `${size}px 'Arial Black'`);
    if (width.width > maxWidth) {
        for (let i = size; size > 0; i--) {
            size = i;
            width = d.measureText(text, `${size}px 'Arial Black'`);
            if (width.width < maxWidth) {
                break;
            }
        }
    }
    return size;
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

async function doc(d, sections, x, y, width, height, maxHeader=70, maxParagraph=35) {
    let innerWidth = width-x;
    let innerHeight = height-y;
    let sectionHeight = innerHeight/sections.length;
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        let headerOffset = y;
        if (section.title) {
            let hSize = Math.min(getMax(d, section.title, innerWidth, maxHeader),sectionHeight/6);
            headerOffset = header(d, `${i}-${0}`, (sectionHeight*i)+y, innerWidth, section.title, hSize);   
        }
        let text = section.lines.join(" ");
        let codeBlocks = [...text.matchAll(/\`\`\`(.*)\`\`\`/g, "")];
        console.log(codeBlocks);
        text = text.replace(/\`\`\`(.*)\`\`\`/g, "");
        text = text.replace(/\`/g,"");
        let codeHeight = 0;
        let codeCan = false;
        if (codeBlocks.length > 0) {
            if (codeBlocks[0][1].split(" ")[0] == "javascript") {
                codeCan = document.createElement("canvas");
                let k = new kod();
                await k.init(codeCan, "javascript", "atom-one-dark", "#212121");
                codeHeight = await k.print(codeBlocks[0][1].slice(11));
            }
        }
        console.log(codeBlocks);
        console.log(codeHeight);

        let {lines, size} = paragraph(d, text, innerWidth, ((sectionHeight-y)-20)-codeHeight);

        for (let b = 0; b < lines.length; b++) {
            d.text(`p${i}-${b}`, lines[b], x, headerOffset+(size*b)+30, `${size}px 'Arial Black'`, "#fff");
        }
    }
}