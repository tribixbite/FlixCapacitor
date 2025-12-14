export interface DirectoryPickerPlugin {
  /**
   * Open the system directory picker and request persistent access
   * Returns a content:// URI with persistent read permissions
   */
  pickDirectory(): Promise<PickDirectoryResult>;

  /**
   * List all files in a previously picked directory using its URI
   * Recursively scans subdirectories and returns video files
   */
  listFiles(options: ListFilesOptions): Promise<ListFilesResult>;

  /**
   * Get list of all directories with persistent permissions
   * Returns URIs for directories that the app still has access to
   */
  getPersistedDirectories(): Promise<PersistedDirectoriesResult>;

  /**
   * Release persistent permissions for a directory URI
   * Should be called when user removes a folder from library
   */
  releaseDirectory(options: ReleaseDirectoryOptions): Promise<void>;

  /**
   * Open a file with an external app using ACTION_VIEW intent
   * Used to play local video files with native video players
   */
  openFile(options: OpenFileOptions): Promise<void>;
}

export interface PickDirectoryResult {
  /**
   * The content:// URI for the selected directory
   * This URI has persistent read permissions granted
   */
  uri: string;

  /**
   * Human-readable display name of the directory
   */
  displayName?: string;
}

export interface ListFilesOptions {
  /**
   * The content:// URI of the directory to list
   */
  uri: string;

  /**
   * File extensions to filter for (e.g., ['.mp4', '.mkv', '.avi'])
   * If not provided, returns all files
   */
  extensions?: string[];

  /**
   * Whether to recursively scan subdirectories
   * Default: true
   */
  recursive?: boolean;
}

export interface FileInfo {
  /**
   * The content:// URI for the file
   */
  uri: string;

  /**
   * File name including extension
   */
  name: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * MIME type (e.g., 'video/mp4')
   */
  mimeType: string;

  /**
   * Relative path from the root directory
   */
  relativePath: string;
}

export interface ListFilesResult {
  /**
   * Array of file information objects
   */
  files: FileInfo[];
}

export interface PersistedDirectoriesResult {
  /**
   * Array of directory URIs with persistent permissions
   */
  uris: string[];
}

export interface ReleaseDirectoryOptions {
  /**
   * The content:// URI to release permissions for
   */
  uri: string;
}

export interface OpenFileOptions {
  /**
   * The content:// URI of the file to open
   */
  uri: string;

  /**
   * MIME type of the file (e.g., 'video/mp4')
   * Default: 'video/*'
   */
  mimeType?: string;
}
