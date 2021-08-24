let canvas = document.createElement("canvas");
document.getElementById("canvas").appendChild(canvas);
canvas.width =  1920;
canvas.height = 1080;
let ctx = canvas.getContext('2d')

let deltaText = -0.3;


let offset = {
    x: -canvas.width / 2,
    y: canvas.height / 2
}

const toPixels = (x, y, zoom=120) => { 
    let center = {
        x: canvas.width / 2  + offset.x + 50,
        y: canvas.height / 2 + offset.y - 50
    }

    return [center.x + x * zoom, center.y - y * zoom] 
}

ctx._moveTo = (x, y) => {
    ctx.moveTo( ...toPixels(x, y) );
}

ctx._lineTo = (x, y) => {
    ctx.lineTo( ...toPixels(x, y) );
}


let unitX = [toPixels(1, 0)[0] -  toPixels(0, 0)[0]]
let unitY = [toPixels(0, 1)[1] -  toPixels(0, 0)[1]]


ctx._rect = (x, y, w, h) => {
    ctx.rect( ...toPixels(x, y), w * unitX, h * unitY )
}

ctx._strokeText = (text, x, y) => {
    ctx.strokeText( text, ...toPixels(x, y) )
}

const drawAxis = () => {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

        ctx._moveTo(0, 0);
        ctx._lineTo(50, 0);
        ctx._moveTo(0, 0);
        ctx._lineTo(0, 50);
        ctx.stroke();
    
        for (let x=0; x < 50; x++)
        {
            if (x % 2 != 0)
                continue;

            ctx.strokeText(`${x}`, ...toPixels(x, deltaText));
        }
    
        for (let y=0; y < 50; y++)
        {
            if (y % 2 != 0)
                continue;
            ctx.strokeText(`${y}`, ...toPixels(deltaText, y));
        }
    
    ctx.closePath();
    
    ctx.beginPath();
        ctx.strokeStyle = "gray"
        for (let x=0; x < 50; x++)
        {
            ctx._moveTo(x, 0);
            ctx._lineTo(x, 50);
        }
    
    
        for (let y=0; y < 50; y++)
        {
            ctx._moveTo(0, y);
            ctx._lineTo(50, y);
        }
    
        ctx.stroke();
    
    ctx.closePath();
    
}


// drawAxis();




let f =(x) => Math.sqrt(x)
// let f =(x) => Math.log(x);
// let f = (x) => Math.cos(0.1*x**2);

const drawGraph = () => {
    ctx.beginPath();
    ctx.strokeStyle ="red";
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    
        ctx._moveTo(0, f(0));
        for (let x=0; x < 20; x += 0.0001) {
            ctx._lineTo(x, f(x))
        }
        ctx.stroke();
    ctx.closePath();    
}



var video = document.querySelector("video");


var videoStream = canvas.captureStream(30);
var mediaRecorder = new MediaRecorder(videoStream);

var chunks = [];
mediaRecorder.ondataavailable = function(e) {
  chunks.push(e.data);
};

mediaRecorder.onstop = function(e) {
  var blob = new Blob(chunks, { 'type' : 'video/mp4' });
  chunks = [];
  var videoURL = URL.createObjectURL(blob);
  video.src = videoURL;
};
mediaRecorder.ondataavailable = function(e) {
  chunks.push(e.data);
};


const drawIntegral = (n=1, drawText=true, stroke=true) => {
    let integral = {
        start: 2,
        end: 14,
        n : n
    }
    
    ctx.beginPath();
    ctx.lineWidth = 1;
        
    ctx.strokeStyle = "black"
    ctx.fillStyle = "#36798b";

    let rect = 0;

    let tex_cords = [];

    for (let x=integral.start; x < integral.end; x+=integral.n)
    {
        let y = f(x)
        ctx._rect(x, 0, integral.n, y );
        tex_cords.push(toPixels(x + integral.n / 2, y / 2))
    }
    
    
    
    ctx.fill();
    if (stroke)
        ctx.stroke();

    if (drawText)
    {
        for (let i=0; i < tex_cords.length; i++)
        {
            ctx.strokeText(`${rect + 1}`, ...tex_cords[i]);
            rect++;
        }
    }    
}


const latexToImg = function(formula) {
  let wrapper = MathJax.tex2svg(formula, {
    em: 10,
    ex: 5,
    display: true
  })

  return wrapper.querySelector('svg');
}

let [_X, _Y] = toPixels(15 / 2, 4.5)
let __IMAGES;
let __LATEX;

const onLatexRenderEnd = (images) => {
    __IMAGES = images;
    startAnimation();

}

const render_latex = (str, callback) => {
    var svgURL = new XMLSerializer().serializeToString(latexToImg(str));
    var img = new Image();
    img.addEventListener("load", () => {
        callback(img);
    })
    
    img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL)
}


const renderLatex = (latex_array, images, i) => {
    if (i < latex_array.length)
    {
        render_latex(`${latex_array[i]}`, (img) => {
            renderLatex(latex_array, [...images, img], i + 1);
        })        
    }
    else
        onLatexRenderEnd(images);
}


let _n = 2;
let maxIter = 9;

const generateLatex = () => {
    let lat  = [];
    let lat2 = [];
    let cur = [_n, 1];
    for (let i=0; i < maxIter; i++)
    {
        lat.push(`dx = ${ (cur[0] / cur[1]) }`)
        // if (cur[1] == 1)
            // lat.push(`dx = ${cur[0]}`)
        // else
            // lat.push(`dx = \\frac{${cur[0]}}{${cur[1]}}`)
        
        

        lat2.push( [cur[0], cur[1]] );
        cur[1] = cur[1] * 2;
        if (cur[0] % cur[1] == 0)
            cur = [cur[0] / cur[1], 1]
    }
    return [lat, lat2];
}

__LATEX = generateLatex()
renderLatex(__LATEX[0], [], 0);


const startAnimation = () => {
    let iter = 0;
    let i = 0;
    mediaRecorder.start();
    
    let int = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.fillStyle = "white";
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fill();
        ctx.closePath();

        // drawAxis();
        // drawGraph();

        if (iter >= 1)
        {
            if (iter <= 3)
                drawIntegral(_n, true);    
            else {
                if (iter >= 7)
                    drawIntegral(_n, false, false);
                else
                    drawIntegral(_n, false);    
            }
                
            _n /= 2;
        }
            


        drawAxis();
        drawGraph();

        if (iter >=1)
        {
            let img = __IMAGES[i]
            // if (__LATEX[0][i][1] != 1  )
            ctx.drawImage(img, _X, _Y, img.width * 3, img.height * 3 )
            i++;
        }


        iter++;
        if (iter >= maxIter)
        {
            clearInterval(int);
            mediaRecorder.stop()
        }
    }, 1000)    
}





