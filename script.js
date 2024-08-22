async function initPoseDetection() {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('output');
    const ctx = canvasElement.getContext('2d');

    // Access the user's webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    // Wait for the video to load before setting dimensions
    await new Promise(resolve => {
        videoElement.onloadeddata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            resolve();
        };
    });

    // Initialize MoveNet model with SinglePose Lightning configuration
    const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

    // Define the connections between keypoints (limbs)
    const keypointConnections = [
        [5, 6], // Shoulders
        [6, 8], // Right upper arm
        [8, 10], // Right lower arm
        [5, 7], // Left upper arm
        [7, 9], // Left lower arm
        [5, 11], // Left hip
        [6, 12], // Right hip
        [11, 13], // Left upper leg
        [13, 15], // Left lower leg
        [12, 14], // Right upper leg
        [14, 16] // Right lower leg
    ];

    // Start detecting poses
    async function detectPose() {
        const poses = await detector.estimatePoses(videoElement);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        poses.forEach(pose => {
            // Draw keypoints
            pose.keypoints.forEach(keypoint => {
                if (keypoint.score > 0.5) {
                    const { y, x } = keypoint;
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#00FF00';
                    ctx.fill();
                }
            });

            // Draw lines between connected keypoints
            keypointConnections.forEach(([start, end]) => {
                const kp1 = pose.keypoints[start];
                const kp2 = pose.keypoints[end];

                if (kp1.score > 0.5 && kp2.score > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#FF0000';
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(detectPose);
    }

    detectPose();
}

initPoseDetection();