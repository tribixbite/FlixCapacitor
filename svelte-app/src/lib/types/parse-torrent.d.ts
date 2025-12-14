/**
 * Type declarations for parse-torrent module
 * @see https://github.com/webtorrent/parse-torrent
 */

declare module 'parse-torrent' {
  interface ParsedTorrent {
    infoHash: string;
    infoHashBuffer?: Buffer;
    name?: string;
    announce?: string[];
    urlList?: string[];
    files?: Array<{
      path: string;
      name: string;
      length: number;
      offset: number;
    }>;
    length?: number;
    pieceLength?: number;
    lastPieceLength?: number;
    pieces?: string[];
    private?: boolean;
    created?: Date;
    createdBy?: string;
    comment?: string;
  }

  /**
   * Parse a torrent identifier (magnet URI, .torrent file, info hash)
   * @param torrentId - The torrent to parse (Buffer, Uint8Array, magnet URI string, info hash string)
   * @returns Parsed torrent object
   */
  function parseTorrent(torrentId: Buffer | Uint8Array | string): ParsedTorrent | null;

  export = parseTorrent;
}
