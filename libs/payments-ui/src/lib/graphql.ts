import { gql } from '@apollo/client';

export const CMS_QUERY = `
  query singleCms($input: SingleCmsInput!) {
    singleCms(input: $input) {
      productName
      termsOfService
      termsOfServiceDownload
      privacyNotice
    }
  }
`;

export const CART_QUERY = gql`
  query singleCart($input: SingleCartInput!) {
    singleCart(input: $input) {
      id
      promotionCode
    }
  }
`;

export const CHECK_CODE = gql`
  mutation checkPromotionCode($input: CheckPromotionCodeInput!) {
    checkPromotionCode(input: $input) {
      id
      promotionCode
    }
  }
`;

export const UPDATE_CART = gql`
  mutation updateCart($input: UpdateCartInput!) {
    updateCart(input: $input) {
      id
      promotionCode
    }
  }
`;
