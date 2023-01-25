import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}



// import Document, { Html, Head, Main, NextScript } from 'next/document';

// class MyDocument extends Document {
//   static async getInitialProps(ctx) {
//     console.log(ctx)
//     const originalRenderPage = ctx.renderPage;

//     // Run the React rendering logic synchronously
//     ctx.renderPage = () =>
//       originalRenderPage({
//         // Useful for wrapping the whole react tree
//         enhanceApp: (App) => App,
//         // enhanceApp: (App) => (props) => {
//         //     console.log(props);
//         //     return <App {...props} />
//         // },
//         enhanceComponent: (Component) => Component,
//       });

//     // Run the parent `getInitialProps`, it now includes the custom `renderPage`
//     const initialProps = await Document.getInitialProps(ctx);
//     // console.log(initialProps);

//     return initialProps;
//   }

//   render() {
//     return (
//       <Html>
//         <Head />
//         <body>
//           <Main />
//           <NextScript />
//         </body>
//       </Html>
//     );
//   }
// }

// export default MyDocument;
