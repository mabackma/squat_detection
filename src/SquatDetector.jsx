import * as tmPose from "@teachablemachine/pose"
import {useState, useEffect} from "react"


// Takes path to model.json and path to metadata.json as props. 
const SquatDetector = () => {
  const path_to_model = "src/assets/models/model1/model.json"
  const path_to_metadata = "src/assets/models/model1/metadata.json"
  let model, webcam, ctx, labelContainer, maxPredictions;

  const [isSquatting, setIsSquatting] = useState(true);

  useEffect(() => {
    const init = async (path_to_model, path_to_metadata) => {

      // Loads model.json and metadata.json.
      model = await tmPose.load(path_to_model, path_to_metadata);
    
      maxPredictions = model.getTotalClasses();
    
      const width = window.innerWidth * 3 / 4;
      const height = window.innerHeight * 3 / 4;
      const flip = true;
      webcam = new tmPose.Webcam(width, height, flip);
      await webcam.setup();
      await webcam.play();
      window.requestAnimationFrame(loop);
    
      const canvas = document.getElementById("canvas");
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d");
      labelContainer = document.getElementById("label-container");
      for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
      }
    
      console.log(model)
    }

    init(path_to_model, path_to_metadata);

    return () => {
      if (webcam) {
        webcam.stop();
      }
    };
  }, []);

  const loop = async () => {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
  }
  
  const predict = async () => {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
  
    for (let i = 0; i < maxPredictions; i++) {
      const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
      labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // Detects if the user is squatting or not
    if (prediction[1].probability > 0.99) {
      setIsSquatting(true);
    }
    else {
      setIsSquatting(false);
    }

    drawPose(pose);
  }
  
  const drawPose = async (pose) => {
    if (webcam.canvas) {
      ctx.drawImage(webcam.canvas, 0, 0);
      // draw the keypoints and skeleton
      if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
      }
    }
  }

  return (
    <div id='model-div'>
      <h1>Squatting: {isSquatting ? 'true' : 'false'}</h1>
      <canvas id="canvas"></canvas>
      <div id="label-container"></div>
    </div>
  )
}

export default SquatDetector