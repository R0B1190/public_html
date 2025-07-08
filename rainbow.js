console.log("hello world")
let element = document.getElementById("tswheader")
console.log(element)
let angle = 0;
let input = document.getElementById("my-input")
let shouldrainbow = true
function onframe(){
    angle += 0.75;
    if(shouldrainbow){
        element.style.backgroundColor = "hsl(" + angle + "deg, 100%, 50%)"
    }
    requestAnimationFrame(onframe)
}
onframe()
function start_rainbow(){
    shouldrainbow = true
}
function onlmbclick(event){
    console.log(input.value)
    //shouldrainbow = false
    document.body.style.backgroundColor = input.value
    //setTimeout(start_rainbow, 1000)
}