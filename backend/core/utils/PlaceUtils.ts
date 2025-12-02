import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { htmlToText } from 'html-to-text';
import * as _ from 'lodash';

export interface IPlaceDetail {
  address: string;
  latitude: number;
  longitude: number;
}

export default class PlaceUtils {
  private static blockedAt = 0;
  private static coccocBlockedAt = 0;

  public static async getGoogleOfficialDistance(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
    redisService?: RedisService,
  ): Promise<number> {
    const key = `distance.${fromLatitude}.${fromLongitude}.${toLatitude}.${toLongitude}`;
    if (redisService) {
      const distance = await redisService.getClient().get(key);
      if (!_.isNil(distance)) {
        return Number(distance);
      }
    }
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${fromLatitude},${fromLongitude}`,
            destinations: `${toLatitude},${toLongitude}`,
            key: process.env.GOOGLE_PLACE_KEY,
          },
        },
      );
      const responseData = response.data;
      console.log(responseData);
      const distance = responseData.rows[0].elements[0].distance.value;
      if (redisService) {
        await redisService
          .getClient()
          .set(key, distance, 'EX', 60 * 60 * 24 * 7);
      }
      return distance;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  public static async getGoogleDistance(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
    redisService?: RedisService,
  ): Promise<number> {
    const key = `distance.${fromLatitude}.${fromLongitude}.${toLatitude}.${toLongitude}`;
    if (redisService) {
      const distance = await redisService.getClient().get(key);
      if (!_.isNil(distance)) {
        return Number(distance);
      }
    }
    if (Date.now() - this.blockedAt < 30 * 60 * 1000) {
      return PlaceUtils.getGoogleOfficialDistance(
        fromLatitude,
        fromLongitude,
        toLatitude,
        toLongitude,
        redisService,
      );
    }
    try {
      const response = await axios.get(
        'https://www.google.com/maps/preview/directions',
        {
          params: {
            gl: 'vn',
            pb: `!1m4!3m2!3d${fromLatitude}!4d${fromLongitude}!4s!1m4!3m2!3d${toLatitude}!4d${toLongitude}!4s!3m8!1m3!1d58636.83246813668!2d105.7433986!3d21.073721!3m2!1i375!2i474!4f13.1!6m14!1m1!18b1!2m0!7b0!17m2!1e1!1e0!20m5!1e9!2e3!3b0!5e2!8b1!26b1!15m7!4m1!2i43954!7e140!9sk!24m1!2e1!40i563`,
          },
        },
      );
      let responseData = response.data;
      responseData = responseData.split("'\n")[1];
      const data = JSON.parse(responseData);
      const distance = data[0][1][0][0][2][0];
      if (redisService) {
        await redisService
          .getClient()
          .set(key, distance, 'EX', 60 * 60 * 24 * 7);
      }
      return distance;
    } catch (e) {
      this.blockedAt = Date.now();
      console.log('Google place API blocked');
      return PlaceUtils.getGoogleOfficialDistance(
        fromLatitude,
        fromLongitude,
        toLatitude,
        toLongitude,
        redisService,
      );
    }
  }

  public static getAddressString(
    address: string,
    ward: string,
    district: string,
    city: string,
  ): string {
    if (!ward) {
      ward = '';
    }
    if (!district) {
      district = '';
    }
    if (!city) {
      city = '';
    }
    return `${ward
      .replace('[Pp]hường', '')
      .replace('[Xx]ã', '')
      .trim()}, ${district
      .replace('[Qq]uận', '')
      .replace('[Hh]uyện', '')
      .trim()}, ${city
      .replace('[Tt]ỉnh', '')
      .replace('[Tt]hành phố', '')
      .trim()}`;
  }

  // public static getLocation(latitude: number, longitude: number): string {
  //   if (!ward) {
  //     ward = '';
  //   }
  //   if (!district) {
  //     district = '';
  //   }
  //   if (!city) {
  //     city = '';
  //   }
  //   return `${ward
  //     .replace('[Pp]hường', '')
  //     .replace('[Xx]ã', '')
  //     .trim()}, ${district
  //     .replace('[Qq]uận', '')
  //     .replace('[Hh]uyện', '')
  //     .trim()}, ${city
  //     .replace('[Tt]ỉnh', '')
  //     .replace('[Tt]hành phố', '')
  //     .trim()}`;
  // }

  public static distance(lat1, lon1, lat2, lon2): number {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      const radlat1 = (Math.PI * lat1) / 180;
      const radlat2 = (Math.PI * lat2) / 180;
      const theta = lon1 - lon2;
      const radtheta = (Math.PI * theta) / 180;
      let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      dist = dist * 1.609344;
      return dist * 1000;
    }
  }

  public static async searchPlaceByGoogleMap(
    query: string,
    latitude: number,
    longitude: number,
  ): Promise<IPlaceDetail[]> {
    try {
      if (Date.now() - this.blockedAt < 30 * 60 * 1000) {
        throw new BadRequestException();
      }
      const response = await axios.get('https://www.google.com/s', {
        params: {
          gl: 'vn',
          gs_ri: 'maps',
          suggest: 'p',
          tbm: 'map',
          q: query,
          pb: `u2d${longitude || 105.8199194}u2d${latitude || 21.022198}`,
        },
        responseType: 'arraybuffer',
      });
      let responseData: string = response.data.toString('latin1');
      responseData = responseData.split("'\n")[1];
      let data = JSON.parse(responseData);
      data = data[0];
      data = data[1];
      return this.parseGmapSearchPlace(data);
    } catch (e) {
      this.blockedAt = Date.now();
      console.log('Google place API blocked');
      throw new InternalServerErrorException();
    }
  }

  public static async searchPlaceByOfficialGoogleMap(
    query: string,
    latitude: number,
    longitude: number,
  ): Promise<IPlaceDetail[]> {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query,
          key: process.env.GOOGLE_PLACE_KEY,
          location: `${latitude || 21.022198},${longitude || 105.8199194}`,
        },
      },
    );
    const responseData = response.data;
    console.log(responseData, {
      query,
      key: process.env.GOOGLE_PLACE_KEY,
      location: `${latitude || 21.022198},${longitude || 105.8199194}`,
    });
    return (responseData.results || [])
      .map((item) => {
        const location = item.geometry?.location;
        return {
          address: item.formatted_address,
          latitude: location?.lat,
          longitude: location?.lng,
        };
      })
      .filter((item) => item.latitude) as IPlaceDetail[];
  }

  public static async searchPlace(
    query: string,
    latitude: number,
    longitude: number,
  ): Promise<IPlaceDetail[]> {
    const isGmapBlocked = Date.now() - this.blockedAt < 30 * 60 * 1000;
    const isCcmapBlocked = Date.now() - this.coccocBlockedAt < 30 * 60 * 1000;
    const isBlocked = isGmapBlocked && isCcmapBlocked;

    if (isBlocked)
      return this.searchPlaceByOfficialGoogleMap(query, latitude, longitude);

    if (isGmapBlocked)
      return this.searchPlaceByCocCoc(query, latitude, longitude);

    try {
      return this.searchPlaceByGoogleMap(query, latitude, longitude);
    } catch (e) {
      console.log(e);
      this.blockedAt = Date.now();
      console.log('Google place API blocked');
      return this.searchPlaceByOfficialGoogleMap(query, latitude, longitude);
    }
  }

  public static async searchPlaceByCocCoc(
    query: string,
    latitude: number,
    longitude: number,
  ): Promise<IPlaceDetail[]> {
    try {
      const response = await axios.get(
        'https://map.coccoc.com/map/search.json',
        {
          params: {
            query,
            suggestions: true,
            borders: `${latitude || 21.022198}%2C${
              longitude || 105.8199194
            }%2C${(latitude || 21.022198) + 0.01}%2C${
              (longitude || 105.8199194) + 0.01
            }`,
          },
        },
      );
      const responseData = response.data.result;
      const data = responseData?.poi;
      return this.parseCocCocMapSearchPlace(data);
    } catch (e) {
      console.log(`search place by CocCoc err`, e);
      this.blockedAt = Date.now();
      throw new InternalServerErrorException();
    }
  }

  public static async location2String(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    if (Date.now() - this.blockedAt < 30 * 60 * 1000) {
      return this.officialLocation2String(latitude, longitude);
    }
    try {
      const response = await axios.get(
        'https://www.google.com/maps/preview/reveal',
        {
          params: {
            gl: 'vn',
            pb: `!2d105.790908225761!3d20.999411527909917!3m2!2d${longitude}!3d${latitude}!4m7!4m1!2i5600!7e140!9savI!17sav!24m1!2e1!5m9!1e1!1e2!1e5!1e11!1e4!2m3!1i335!2i120!4i8!6m11!2b1!4b1!5m1!6b1!17b1!20m2!1e3!1e1!24b1!29b1!89b1`,
          },
        },
      );
      let responseData: string = response.data;
      responseData = responseData.split("'\n")[1];
      const data = JSON.parse(responseData);
      console.log(data);
      return data[0].join(', ');
    } catch (e) {
      console.log(e);
      this.blockedAt = Date.now();
      console.log('Google place API blocked');
      return this.officialLocation2String(latitude, longitude);
    }
  }

  public static async officialLocation2String(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: process.env.GOOGLE_PLACE_KEY,
          },
        },
      );
      const responseData = response.data;
      console.log(responseData);
      return responseData.results[0].formatted_address;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  public static getCity = async (latitude: number, longitude: number) => {
    return;
    // const city = await geocoder.reverse(latitude, longitude);
    // return city?.admin1;
  };

  public static async getLatLongByAddress(address: string) {
    if (Date.now() - this.blockedAt < 30 * 60 * 1000) {
      return this.getOfficialLatLongByAddress(address);
    }
    try {
      const response = await axios.get('https://www.google.com/search', {
        params: {
          tbm: 'map',
          hl: 'vi',
          q: address,
          oq: address,
          pb: '!10b1!12e5!24m52!1m16!13m7!2b1!3b1!4b1!6i1!8b1!9b1!20b1!18m7!3b1!4b1!5b1!6b1!9b1!13b1!14b0!2b1!5m5!2b1!3b1!5b1!6b1!7b1!10m1!8e3!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!43b1!52b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!89b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i458!2i1188!1m6!1m2!1i1532!2i0!2m2!1i1582!2i1188!1m6!1m2!1i0!2i0!2m2!1i1582!2i20!1m6!1m2!1i0!2i1168!2m2!1i1582!1e81',
        },
        responseType: 'text',
      });
      let responseData: string = response.data;
      responseData = responseData.split("'\n")[1];
      const data = JSON.parse(responseData);
      let addressData;
      let latitude = data[1][0][2];
      let longitude = data[1][0][1];
      try {
        const addressResults = data[0][1];
        for (const addressResult of addressResults) {
          if (addressResult && addressResult[14]) {
            addressData = addressResult[14][18];
            if (addressResult[14][9]) {
              latitude = addressResult[14][9][2];
              longitude = addressResult[14][9][3];
            }
            break;
          }
        }
      } catch (e) {
        console.log(e);
      }
      return {
        latitude,
        longitude,
        address: addressData?.replace(/\n/g, ' ').replace(/\t/g, ' '),
      };
    } catch (e) {
      console.log('data', e);
      this.blockedAt = Date.now();
      console.log('Google place API blocked');
      return this.getOfficialLatLongByAddress(address);
    }
  }

  public static async getOfficialLatLongByAddress(address: string) {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: process.env.GOOGLE_PLACE_KEY,
          },
        },
      );
      const responseData = response.data;
      const result = responseData.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
      };
    } catch (e) {
      console.log('data', e);
      throw new InternalServerErrorException();
    }
  }

  public static parseGmapSearchPlace(data: any) {
    return data
      .map((item) => {
        item = item[item.length - 1];
        return {
          address: htmlToText(item[0][0])
            ?.replace(/\n/g, ' ')
            .replace(/\t/g, ' '),
          latitude: (item[11] || [])[2],
          longitude: (item[11] || [])[3],
        };
      })
      .filter((item) => item.latitude) as IPlaceDetail[];
  }

  public static parseCocCocMapSearchPlace(data: any) {
    return data
      .map((item) => {
        const addr = [
          htmlToText(item.address)?.replace(/\n/g, ' ').replace(/\t/g, ' '),
        ];
        if (item.title) addr.unshift(htmlToText(item.title));
        return {
          address: addr.join(', '),
          latitude: item.gps?.latitude,
          longitude: item.gps?.longitude,
        };
      })
      .filter((item) => item.latitude) as IPlaceDetail[];
  }
}
