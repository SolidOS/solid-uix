import {initLibraries, localWebid, str2node, str2stm, getNodeFromFieldValue, curie} from './utils';

  describe('localWebId definition', () => {
    let mockFetchPromise = new Promise((resolve, reject) => { 
      resolve();
    });
    global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
    
    test('localWebId method is defined', () => {
      expect(localWebid).toBeDefined();
    });
    
    test('localWebid returns the value of webId if it is truthy', async () => {
      window.SolidAppContext = {
        "webId":"https://example.pod.provider/profile/card#me"
      };
    
      expect(await localWebid()).toBe('https://example.pod.provider/profile/card#me');
    });
    
    test('localWebid returns a default webid if webId is falsey and the request is successful', async () => {
      window.SolidAppContext = {
        "webId":""
      };
      let mockFetchPromise = new Promise((resolve, reject) => { 
        resolve({"status":200});
      });
      global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
    
      expect(await localWebid()).toBe('http://localhost/profile/card#me');
    });
    
    test('localWebid returns a default webid if webId is falsey and the request is unsuccessful', async () => {
      window.SolidAppContext = {
        "webId":""
      };
      let mockFetchPromise = new Promise((resolve, reject) => { 
        resolve({"status":300});
      });
      global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
    
      expect(await localWebid()).toBe(undefined);
    });
  });
  
  describe('str2node definition', () => {
  
    test('str2node method is defined', () => {
      expect(str2node).toBeDefined();
    });
  
    beforeEach(async () => {
      await initLibraries();
    });
  
    describe.each([
      [undefined, undefined, "", 'str2node returns a blank string if "string" argument is falsey'],
      ["*", undefined, null, 'str2node returns a null if "string" argument equals "*"'],
      ["<", undefined, undefined, 'str2node returns undefined if "string" argument starts with "<"'],
      ["<", "", undefined, 'str2node returns undefined value, if "string" starts with "<" and "baseUrl" is a blank string'],
      ["<https://example2.com/#unique-id", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "https://example2.com/#unique-id"}, 'str2node returns a NamedNode value, if "string" starts with "<", "baseUrl" is ignored'],
      ["<https://example2.com/#unique-id>", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "https://example2.com/#unique-id"}, 'str2node returns a NamedNode value, if "string" starts with "<" and ends with ">" (triple format), "baseUrl" is undefined'],
      ["a", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}, 'str2node returns a NamedNode value of type, if "string" argument equals "a"'],
      [":", undefined, undefined, 'str2node returns undefined value, if "string" starts with ":" and "baseUrl" is undefined'],
      [":", "", undefined, 'str2node returns undefined value, if "string" starts with ":" and "baseUrl" is a blank string'],
      [":unique-id", "https://example.com/", {"classOrder": 5, "termType": "NamedNode", "value": "https://example.com/#unique-id"}, 'str2node returns a NamedNode value, if "string" starts with ":" and "baseUrl" is a URI string'],
      [":unique-id:1:", "https://example.com/", {"classOrder": 5, "termType": "NamedNode", "value": "https://example.com/#unique-id:1:"}, 'str2node returns a NamedNode value preserving all but the first colon, if "string" starts with ":" and "baseUrl" is a URI string'],
      ["bk:unique-id", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "http://www.w3.org/2002/01/bookmark#unique-id"}, 'str2node returns a NamedNode value, if "string" starts with "bk:", "baseUrl" is ignored'],
      ["unique-idbk:", undefined, undefined, 'str2node returns an undefined value, if "string" contains but does not start with "bk:", "baseUrl" is ignored'],
      ["geo:lat", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "http://www.w3.org/2003/01/geo/wgs84_pos#lat"}, 'str2node returns a NamedNode value, if "string" starts with a known vocabulary prefix and contains ":" but does not start with ":" or "http:" or "chrome:", "baseUrl" is ignored'],
      ["http://www.w3.org/2003/01/geo/wgs84_pos#lat", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "http://www.w3.org/2007/ont/http#//www.w3.org/2003/01/geo/wgs84_pos#lat"}, 'str2node returns an ontology prefixed NamedNode value, if "string" starts with http:, "baseUrl" is ignored'], // ToDo: This may indicate a bug
      ["/:", undefined, {"classOrder": 5, "termType": "NamedNode", "value": "/:"}, 'str2node returns a NamedNode value, if "string" starts with /:, "baseUrl" is ignored'],
      ["hello world", undefined, {
        "classOrder": 1,
        "datatype": {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string"
        },
        "isVar": 0,
        "language": "",
        "termType": "Literal",
        "value": "hello world"
      }, 'str2node returns a LiteralNode value, if "string" is a literal forcing the call to $rdf.sym to fail, "baseUrl" is ignored']
    ])('',(string, baseUrl, expectedResult, testDescription) => {
      test(testDescription, () =>{
        expect(str2node(string, baseUrl)).toEqual(expectedResult);
      })
    });
  
    test('str2node returns a NamedNode value preserving all but the first less-than, if "string" starts with "<" and "baseUrl" is undefined', async () => {
      // ToDo: This actually highlights a bug, we should replace all < with '', as < is not valid in a URI - see https://stackoverflow.com/a/7109208
      await initLibraries();
    
      let actual = str2node("<https://example2.com/#unique-id<1<",undefined);
      expect(actual).toEqual({"classOrder": 5, "termType": "NamedNode", "value": "https://example2.com/#unique-id<1<"});
    });
    
    test('str2node returns a NamedNode value preserving all but the last greater-than, if "string" starts with "<" and "baseUrl" is undefined', async () => {
      // ToDo: This actually highlights a bug, we should replace all > with '', as > is not valid in a URI - see https://stackoverflow.com/a/7109208
      await initLibraries();
    
      let actual = str2node("<https://example2.com/#unique-id<>1",undefined);
      expect(actual).toEqual({"classOrder": 5, "termType": "NamedNode", "value": "https://example2.com/#unique-id<>1"});
    });
  
    test('str2node returns an undefined value, if "string" starts with https and contains ":" but does not start with ":" or "http:" or "chrome:", "baseUrl" is ignored', async () => {
      // ToDo: This may highlight a bug, we should be checking for the presence of https: at the start of the string too, as https is not a valid vocab namespace prefix, but it may be a URI being used to represent an RDF identifier (for example if <http://www.w3.org/2003/01/geo/wgs84_pos#lat> were to migrate to <https://www.w3.org/2003/01/geo/wgs84_pos#lat>, this would currently break).
      await initLibraries();
    
      let actual = str2node("https://example2.com",undefined);
      expect(actual).toEqual(undefined);
    });
  });
  
  describe('str2stm definition', () => {
    beforeEach(async () => {
      await initLibraries();
    });
  
    describe.each([
      ["  <http://example.org/subject1> <http://example.org/predicate1> \"object1\"",
       "chrome:theSession",
      {
        "graph": {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "chrome:theSession",
        },
        "object":  {
          "classOrder": 1,
          "classOrder": 1,
        "datatype":  {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string",
        },
        "isVar": 0,
        "language": "",
        "termType": "Literal",
         "value": "\"object1\"",
      },
       "predicate": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/predicate1",
       },
       "subject": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/subject1",
       }
      },
      'str2stm returns a value, if "querystring" contains a triple with preceding whitespace, "source" is chrome session string'],
      [  "<http://example.org/subject1> <http://example.org/predicate1> \"object1\"  ",
      "chrome:theSession",
      {
        "graph": {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "chrome:theSession",
        },
        "object":  {
          "classOrder": 1,
          "classOrder": 1,
        "datatype":  {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string",
        },
        "isVar": 0,
        "language": "",
        "termType": "Literal",
         "value": "\"object1\"",
      },
       "predicate": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/predicate1",
       },
       "subject": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/subject1",
       }
      },
      'str2stm returns a value, if "querystring" contains a triple with postceding whitespace, "source" is chrome session string']
    ])('',(querystring, source, expectedResult, testDescription) => {
      test(testDescription, () =>{
        expect(str2stm(querystring, source)).toEqual(expectedResult);
      })
    });
  
    test('str2stm returns a value, if "querystring" contains a turtle triple, "source" is chrome session string', () => {
      // ToDo: This highlights three potential bugs 1) returned object literal contains speechmarks, 2) the fullstop 3) source can be undefined or blank string and throw an error
    
      let actual = str2stm("<http://example.org/subject1> <http://example.org/predicate1> \"object1\" .","chrome:theSession");
      expect(actual).toEqual({
        "graph": {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "chrome:theSession",
        },
        "object":  {
          "classOrder": 1,
          "classOrder": 1,
        "datatype":  {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string",
        },
        "isVar": 0,
        "language": "",
        "termType": "Literal",
         "value": "\"object1\" .",
      },
       "predicate": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/predicate1",
       },
       "subject": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/subject1",
       }
      });
    });
  
    test('str2stm returns a value, if "querystring" contains a triple with an internationalised literal object, "source" is chrome session string', async () => {
      // ToDo: This could highlight a bug, is this parsing of the string literal correct when given the internationalised label?
    
      let actual = str2stm("<http://example.org/subject1> <http://example.org/predicate1> \"object1\"@en-GB","chrome:theSession");
      expect(actual).toEqual({
        "graph": {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "chrome:theSession",
        },
        "object":  {
          "classOrder": 1,
          "classOrder": 1,
        "datatype":  {
          "classOrder": 5,
          "termType": "NamedNode",
          "value": "http://www.w3.org/2001/XMLSchema#string",
        },
        "isVar": 0,
        "language": "",
        "termType": "Literal",
         "value": "\"object1\"@en-GB",
      },
       "predicate": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/predicate1",
       },
       "subject": {
         "classOrder": 5,
         "termType": "NamedNode",
         "value": "http://example.org/subject1",
       }
      });
    });
  });
  
  test('getNodeFromFieldValue returns undefined, if "fieldSelector" contains a value that exists on the DOM (as a SELECT element), "key" is ignored', async () => {
    // ToDo: This seems to indicate a bug, this test throws an error, the code passes the entire OPTION element to the sym function, instead of passing the value of the OPTION element.
    const selectElement = document.createElement('select');
  
    const option1 = document.createElement('option');
    option1.value = 'option1';
    option1.text = 'Option 1';
    selectElement.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = 'option2';
    option2.text = 'Option 2';
    selectElement.appendChild(option2);
    
    const option3 = document.createElement('option');
    option3.value = 'option3';
    option3.text = 'Option 3';
    selectElement.appendChild(option3);
  
    selectElement.selectedIndex = 2;
  
    jest.spyOn(document, 'getElementById').mockReturnValue(selectElement);
  
    let node = getNodeFromFieldValue("#unique-id", undefined)
  
    expect(node).toBe(undefined);
  
    jest.restoreAllMocks();
  });
  
  test('curie returns a NamedNode value, if "string" is a value that contains a : with a known rdf prefix before the colon', async () => {
    const string = 'rdfs:label';
  
    const actual = curie(string);
  
    expect(actual).toEqual({"classOrder": 5, "termType": "NamedNode", "value": "http://www.w3.org/2000/01/rdf-schema#label"});
  });
