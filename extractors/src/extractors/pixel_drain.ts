/**
 * Original CloudStream Extractor by: @keyiflerolsun | @KekikAkademi
 * Ported to TypeScript for SkyStream by: @arranoust
 */

import { ExtractorApi, IExtractorLink } from '../core/extractor_api';
import { Qualities } from '../core/qualities';

export class PixelDrain extends ExtractorApi {
  name = 'PixelDrain';
  mainUrl = 'https://pixeldrain.com';
  requiresReferer = true;

  async getUrl(url: string, referer?: string): Promise<IExtractorLink[]> {
    const match = /\/u\/(.*)/.exec(url);
    const mId = match ? match[1] : null;

    let streamUrl = url;
    
    if (mId) {
      streamUrl = `${this.mainUrl}/api/file/${mId}?download`;
    }

    return [{
      name: this.name,
      source: this.name,
      url: streamUrl,
      quality: Qualities.Unknown,
      type: 'video', 
      headers: { 
        Referer: url 
      }
    }];
  }
}

export class PixelDrainDev extends PixelDrain {
  name = 'PixelDrainDev';
  mainUrl = 'https://pixeldrain.dev';
}
