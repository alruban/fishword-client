import React, { useRef } from "react";
import { World } from "../../../../../../world";
import { playerUploadFace } from "../../../../../db/db";
import { ReactSVG } from "react-svg";

interface SettingsInteractorProps {
  world: World
}

const SettingsInteractor: React.FC<SettingsInteractorProps> = ({world}) => {
  const errorEl = useRef<HTMLElement | null>(null);

  const faceFileInputEl = useRef<HTMLInputElement | null>(null);
  const faceFileTriggerEl = useRef<HTMLLabelElement | null>(null);
  const faceFileTriggerElDefaultText = "Upload JPEG File";

  const handleError = (error: Error | null) => {
    if (errorEl.current && error) errorEl.current.textContent = String(error);
  }

  const handleFaceFileChange = (e: any) => {
    if (e.target.files.length > 0) {
      if (!e.target.files[0]) return;

      const fileSize = e.target.files[0].size / 1024 / 1024; // in MB
      const fileType = e.target.files[0].type;
      const fileName = e.target.files[0].name;

      if (fileSize > 2) {
        handleError(new Error('The file is too large. Please select a file that is less than 2MB.'));

        e.target.value = ''; // Reset the input
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = faceFileTriggerElDefaultText;
      } else if (fileType !== "image/jpeg") {
        handleError(new Error('The uploaded image is not a JPEG/JPG file.'));

        e.target.value = ''; // Reset the input
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = faceFileTriggerElDefaultText;
      } else {
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = fileName;
      }
    }
  }

  const clearFaceFileInput = () => {
    if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = faceFileTriggerElDefaultText;
    if (faceFileInputEl.current) faceFileInputEl.current.value = '';
  }

  const handleFaceFileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    playerUploadFace(
      formData,
      (data) => {
        clearFaceFileInput();
        world.player.state.face = data.face;
        world.socket.emit('player:settings:face:updated', data.face);
      },
      (error: Error) => handleError(error)
    )
  }

  return (
    <>
      <p className="w-full text-center text-md">
        SETTINGS
      </p>

      <hr className="bg-key-yellow-active"/>

      <div className="flex items-center justify-center text-xs gap-x-2">
        <p>Face: </p>
        <form
          id="face-upload"
          className='flex items-center w-fit h-fit gap-x-2'
          onSubmit={handleFaceFileSubmit}
        >
          <div className='flex flex-col gap-y-2'>
            <label
              htmlFor="face"
              className="custom-file-upload"
              ref={faceFileTriggerEl}
            >
              {faceFileTriggerElDefaultText}
            </label>
            <input
              className='w-full'
              id='face'
              name="face"
              type="file"
              accept="image/jpeg"
              onChange={handleFaceFileChange}
              required
              ref={faceFileInputEl}
            />
          </div>

          <button type="submit">
            <ReactSVG
              src="../../../../../../images/upload.svg"
              className="w-4"
            />
          </button>
        </form>

        <small
          className='text-xs text-validation-error'
          ref={errorEl}
        ></small>
      </div>
    </>
  )
}

export default SettingsInteractor;
