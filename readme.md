# Renamer

A simple Node.js command-line tool for updating video metadata titles and batch-renaming video files.

## Features

- **Update video metadata:** Set each video's embedded title to its filename (without the extension).
- **Batch rename videos:** Rename files sequentially using a custom name and episode numbers.
- **Natural sorting:** Sort filenames numerically, so `Episode 2.mp4` comes before `Episode 10.mp4`.
- **No re-encoding:** Uses FFmpeg stream copying to avoid re-encoding video and audio.
- **Error handling:** Reports FFmpeg failures and attempts to clean up temporary files.

## Requirements

- [Node.js](https://nodejs.org/) (a version that supports the JSON import syntax used by the project).
- [FFmpeg](https://ffmpeg.org/) installed and accessible from your system's `PATH`.

## Installation

Clone the repository and install the package globally from its directory:

```bash
git clone <repository-url>
cd <repository-directory>
npm install -g .
```

Verify that the installation works:

```bash
renamer --version
```

Replace `<repository-url>` and `<repository-directory>` with your repository URL and the directory name created by cloning it.

## Usage

Run `renamer` from the directory containing the videos you want to process.

### 1. Update video metadata titles

```bash
renamer mp4
```

Updates the embedded metadata title of every `.mp4` file in the current directory to match its filename, excluding the extension.

For example, `Episode 01.mp4` will have its embedded title set to `Episode 01`.

The original filename remains unchanged.

### 2. Batch rename video files

```bash
renamer mp4 "Rings Of Power"
```

Renames `.mp4` files sequentially using the supplied name.

Example:

```text
Original files:
1.mp4
2.mp4
3.mp4

Renamed files:
Rings Of Power Ep01.mp4
Rings Of Power Ep02.mp4
Rings Of Power Ep03.mp4
```

Files are processed in natural numeric order where possible.

### 3. Display the version

```bash
renamer --version
```

Displays the installed version of Renamer.

### 4. Display help

```bash
renamer --help
```

Displays the available commands and usage examples.

## How it works

When updating metadata, Renamer:

1. Reads the video files in the current directory.
2. Sorts the filenames naturally.
3. Uses FFmpeg to copy the existing streams into a temporary output file while setting the metadata title.
4. Replaces the original file with the processed output.
5. Attempts to remove the temporary output if processing fails.

Because FFmpeg uses stream copying (`-c copy`), the audio and video streams are not re-encoded. However, the file is still remuxed, which can take time and may not preserve every container-specific detail.

## Notes and limitations

- Renamer processes files in the **current working directory**, not recursively through subdirectories.
- File extensions are supplied as the first argument, such as `mp4` or `mkv`, without a leading dot.
- Metadata updates require FFmpeg to be installed and available through `PATH`.
- Batch renaming may skip files when the proposed destination filename already exists. Review the output filenames before running it on important files.
- Back up important files before bulk operations.
