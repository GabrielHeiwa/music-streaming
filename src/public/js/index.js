const btn = document.querySelector("button");
const input_file = document.querySelector("input");
const audio = document.querySelector("audio");

input_file.addEventListener("change", (e) => {
    const music = input_file.files[0]

    const reader = new FileReader();
    reader.onload = function (e) {
        audio.src = e.target.result
    };
    reader.readAsDataURL(music)
});

btn.addEventListener("click", async () => {
    const data = new Date(null);
    data.setSeconds(audio.duration);
    const music_duration = data.toISOString().substr(12,8).split('.')[0];

    const Frm_Data = new FormData();
    Frm_Data.append("music", input_file.files[0]);
    Frm_Data.append("music_duration", music_duration);


    await axios.post("/music_upload", Frm_Data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
});