import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RippleModule } from 'primeng/ripple';
import { PanelModule } from 'primeng/panel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SliderModule } from 'primeng/slider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReadVariablesDialogComponent } from '../read-variables-dialog/read-variables-dialog.component';

type Priorities = {
  elements: string[];
  priority: number;
};

type Token = {
  element: string;
  type: string;
  line: number;
};

type ToggleEvent = {
  originalEvent: Event;
  checked: boolean;
};

type Operator = {
  element: string;
  priority: number;
};

type Identifier = {
  variable: string,
  value: any
}

@Component({
  selector: 'app-compiler',
  imports: [
    FormsModule,
    TextareaModule,
    ButtonModule,
    TableModule,
    RippleModule,
    PanelModule,
    ToggleSwitchModule,
    CommonModule,
    SliderModule
  ],
  templateUrl: './compiler.component.html',
  styleUrl: './compiler.component.scss',
  providers: [DialogService, DynamicDialogRef]
})
export class CompilerComponent {
  constructor(
    private dialogService: DialogService,
    private ref: DynamicDialogRef
  ) { }

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  checked: boolean = false;
  isExecuting: boolean = false;
  sliderValue: number = 0;
  tokenValue: string | null = null;
  tokenType: string | null = null;

  //Variables para monitorear construcción del VCI paso a paso
  milliseconds: number = 0;

  //Codigo que se escribe en el editor de codigo
  codeText: string | any = null;

  //Array donde se guardan los tokens del texto del codigo
  tokens: Token[] = [];

  //Variable para saber si un operador sigue vaciando la pila o no
  keepEmptying: boolean = true;

  //Variable para saber si hay una condición vigente
  isCondition: boolean = false;

  //Variable para saber si hay un do
  isDo: boolean = false;

  //Variable para saber si hay un while
  isWhile: boolean = false;

  //Variable para saber si hay algún estatuto de lectura o escritura
  isReadln: boolean = false;
  isPrintln: boolean = false;

  //Variable para saber en que parte del VCI va la pila de ejecución
  indexVci: number = 0;

  //Variable para saber en que parte de la tabla de tokens se encuentra
  indexTokens: number = 0;

  //Contenido del texto de la consola
  consoleText: string = '';

  //Lista de prioridades
  priorityList: Priorities[] = [
    { elements: ['*', '/', '%'], priority: 60 },
    { elements: ['+', '-'], priority: 50 },
    { elements: ['<', '>', '<=', '>=', '==', '!='], priority: 40 },
    { elements: ['!'], priority: 30 },
    { elements: ['&&'], priority: 20 },
    { elements: ['||'], priority: 10 },
    { elements: ['=', '('], priority: 0 },
  ];

  //Lista de elementos para separar tokens
  keywords: string[] = [
    'if',
    'else',
    'while',
    'return',
    'proc',
    'entero',
    'do',
    'readln',
    'println',
  ];
  operators: string[] = [
    '+',
    '-',
    '*',
    '/',
    '%',
    '=',
    '==',
    '!=',
    '<',
    '>',
    '<=',
    '>=',
    '&&',
    '||',
    '!'
  ];
  punctuation: string[] = ['(', ')', ';', '{', '}', ','];

  //Array que representa el VCI
  VCI: string[] = [];

  //Pila de operadores
  operatorStack: Operator[] = [];

  //Pila de direcciones
  directionStack: number[] = [];

  //Pila de estatutos compuestos
  composedStack: string[] = [];

  //Pila de ejecución
  executionStack: string[] = [];

  //Array donde se guardarán los valores de las variables
  identifierList: Identifier[] = [];

  //Expresión regular que separa los tokens del editor de codigo
  //
  regex =
    /"[^"]*"|\d+|==|!=|<=|>=|&&|\|\||[a-zA-Z_][a-zA-Z0-9_]*|[+\-*/%<>=!(){};]/g;

  //Logica para abrir y leer archivos//
  openFileExplorer(): void {
    this.fileInputRef.nativeElement.click();
  }

  readFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const archivo = input.files[0];
    const lector = new FileReader();

    lector.onload = () => {
      this.codeText = lector.result as string;
      this.analyzeFile();
    };

    lector.readAsText(archivo);
  }
  //\Logíca para abrir y leer archivos\\

  //Método para analizar el código y separar sus componentes.
  analyzeFile() {
    this.VCI = [];
    this.directionStack = [];
    this.operatorStack = [];
    this.composedStack = [];
    this.executionStack = [];
    this.consoleText = '';
    this.indexVci = 0;
    this.isExecuting = false;
    const lines: string[] = this.codeText.split(/\r?\n/) || [];
    this.tokens = [];

    lines.forEach((line, index) => {
      const matches: any = line.match(this.regex);

      if (matches) {
        matches.forEach((token: string) => {
          let type = 'unknown';

          if (/^".*"$/.test(token)) {
            type = 'string';
          } else if (/^\d+(\.\d+)?$/.test(token)) {
            type = 'constant';
          } else if (this.keywords.includes(token)) {
            type = 'keyword';
          } else if (this.operators.includes(token)) {
            type = 'operator';
          } else if (this.punctuation.includes(token)) {
            type = 'punctuation';
          } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
            type = 'identifier';
          }

          this.tokens.push({
            element: token,
            type,
            line: index + 1,
          });
        });
      }
    });
  }

  //Método para obtener la prioridad de un elemento
  getPriority(element: string): Priorities | null {
    const group: Priorities | undefined = this.priorityList.find((group) =>
      group.elements.includes(element)
    );
    return group ?? null;
  }

  //Método para formatear el typo de token (Logica frontend, opcional)
  formatType(type: string): string {
    switch (type) {
      case 'identifier':
        return 'Identificador';

      case 'keyword':
        return 'Palabra Reservada';

      case 'string':
        return 'String';

      case 'constant':
        return 'Constante';

      case 'operator':
        return 'Operador';

      case 'punctuation':
        return 'Signo de puntuación';

      default:
        return 'Desconocido';
    }
  }

  //Metodo auxiliar para causar un delay en la construcción del vci
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //Método para construir el VCI en base a los tokens recorridos
  async buildVCI(): Promise<void> {
    this.isExecuting = false;
    this.VCI = [];
    this.directionStack = [];
    this.operatorStack = [];
    this.composedStack = [];
    this.executionStack = [];
    this.consoleText = '';
    this.indexVci = 0;

    //for (let index = 0; index < this.VCI.length; index++)
    for (let index = 0; index < this.tokens.length; index++) {
      this.tokenValue = this.tokens[index].element;
      this.tokenType = this.tokens[index].type
      this.indexTokens = index;

      await this.delay(this.milliseconds);

      switch (this.tokenType) {
        case 'identifier':
          this.handleIdentifiersConstants(this.tokenValue);
          break;

        case 'constant':
          this.handleIdentifiersConstants(this.tokenValue);
          break;

        case 'string':
          this.handleIdentifiersConstants(this.tokenValue);
          break;

        case 'operator':
          this.handleOperators(this.tokenValue);
          break;

        case 'keyword':
          this.handleKeywords(this.tokenValue);
          break;

        case 'punctuation':
          this.handlePunctuation(this.tokenValue, index);
          break;
      }
    }
  }

  //Manejar tokens de puntuación
  handlePunctuation(punctuation: string, index: number): void {
    switch (punctuation) {
      case ';':
        this.handleSemiColon();
        break;

      case '(':
        this.handleOpeningParenthesis();
        break;

      case ')':
        this.handleClosingParenthesis();
        break;

      case '}':
        this.handleClosingBracket(index);
        break;

      default:
        break;
    }
  }

  //Manejar estatutos compuestos en el VCI
  handleKeywords(keyword: string): void {
    switch (keyword) {
      case 'if':
        this.handleIf();
        break;

      case 'else':
        this.handleElse();
        break;

      case 'readln':
        this.isReadln = true;
        break;

      case 'println':
        this.isPrintln = true;
        break;

      case 'do':
        this.handleDo();
        break;

      case 'while':
        this.handleWhile();
        break;

      default:
        break;
    }
  }

  //Método para manejar el while
  handleWhile(): void {
    if (!this.isDo) {
      this.composedStack.push('while');
      this.directionStack.push(this.VCI.length);
      this.isWhile = true;
    }
  }

  //Método para manejar el do
  handleDo(): void {
    this.composedStack.push('do');
    this.directionStack.push(this.VCI.length)
    this.isDo = true;
  }

  //Método para manejar if's
  handleIf(): void {
    this.composedStack.push('if');
    this.isCondition = true;
  }

  //Metodo para manejar else's
  handleElse(): void {
    this.composedStack.push('else');
    const topDirection = this.directionStack.pop() || -1;
    this.VCI[topDirection] = `${this.VCI.length + 2}`;
    this.directionStack.push(this.VCI.length);
    this.VCI.push('Vacio');
    this.VCI.push('else');
  }

  //Manejar Operadores en el VCI
  handleOperators(operator: string): void {
    //Obtiene la prioridad del operador encontrado
    const priorityOperator: Priorities = this.getPriority(operator) || {
      elements: [''],
      priority: 1000,
    };

    //Obtiene el operador top y su prioridad
    while (this.keepEmptying && this.operatorStack.length > 0) {
      const topOperator: Operator =
        this.operatorStack[this.operatorStack.length - 1];

      //Si el operador mas alto en la pila de operadores es un (, ignorar
      if (topOperator.element === '(') {
        this.keepEmptying = false;
        break;
      }

      //Si la prioridad del operador es menor o igual, saca el operador top de la pila de operadores y los pasa al VCI
      if (priorityOperator.priority <= topOperator.priority) {
        const top: Operator = this.operatorStack.pop() || {
          element: '',
          priority: 1000,
        };

        this.VCI.push(top.element);
      }

      //Si la prioridad es mayor, deja de vaciar la pila
      if (priorityOperator.priority > topOperator.priority) {
        this.keepEmptying = false;
      }
    }

    this.operatorStack.push({
      element: operator,
      priority: priorityOperator.priority,
    });

    this.keepEmptying = true;
  }

  //Manejar el caso especial para el el bracket de cierre
  handleClosingBracket(index: number): void {
    const topComposed = this.composedStack.pop();

    switch (topComposed) {
      case 'if':
        if (!(this.tokens[index + 1].element === 'else')) {
          const topDirection = this.directionStack.pop() || -1;
          this.VCI[topDirection] = `${this.VCI.length + 2}`;
        }
        break;

      case 'else':
        console.log("El cierre de estatuto else ha sacado una dirección")
        const topDirection = this.directionStack.pop() || -1;
        this.VCI[topDirection] = `${this.VCI.length}`;
        break;

      case 'while':
        const topDirectionWhile = this.directionStack.pop() || -1;
        this.VCI[topDirectionWhile] = `${this.VCI.length + 2}`
        const topDirectionWhile2 = this.directionStack.pop() || -1;
        this.VCI.push(`${topDirectionWhile2}`);
        this.VCI.push('finW');
        break;

      default:
        break;
    }
  }

  //Manejar el caso especial para el parentesis de apertura
  handleOpeningParenthesis(): void {
    this.operatorStack.push({ element: '(', priority: 0 });
  }

  //Manejar el caso especial para el parentesis de cierre
  handleClosingParenthesis(): void {
    //Retira todos los operadores de la pila hasta que encuentra el primer '(', lo retira y lo deshecha
    while (this.keepEmptying) {
      const topOperator: Operator = this.operatorStack[
        this.operatorStack.length - 1
      ] || { element: '', priority: 1000 };

      if (topOperator.element === '(') {
        this.operatorStack.pop();
        break;
      }

      this.VCI.push(topOperator.element);
      this.operatorStack.pop();
    }

    this.keepEmptying = true;

    //Manejar caso esecial para final de un estatuto do
    if (this.isDo && !this.isCondition) {
      console.log("El estatuto do ha sacado una direccion de la pila!!!")
      const topDirection: number = this.directionStack.pop() || -1;
      this.VCI.push(`${topDirection}`);
      this.VCI.push('finDo');
      this.isDo = false;
    }

    //Manejar caso especial para final de condicion de un while
    if (this.isWhile && !this.isCondition) {
      console.log("Que acaso esto es un while?")
      this.directionStack.push(this.VCI.length);
      this.VCI.push('Vacío');
      this.VCI.push('while');
      this.isWhile = false;
    }

    //Manejar caso especial en caso de que el cierre de parentesis sea el final de una condición
    if (this.isCondition) {
      this.directionStack.push(this.VCI.length);
      this.VCI.push('Vacio');
      this.VCI.push('if');
      this.isCondition = false;
    }

    if (this.isReadln) {
      this.isReadln = false;
    }

    if (this.isPrintln) {
      this.isPrintln = false;
    }
  }

  //Manejar el caso especial para el operador ;
  handleSemiColon(): void {
    let index: number = 0;
    while (this.operatorStack.length > 0) {
      const topOperator: Operator = this.operatorStack.pop() || {
        element: '',
        priority: 1000,
      };
      this.VCI.push(topOperator.element);
      index++;
    }

    console.log(this.VCI);
  }

  //Manejar los identificadores y constantes en el VCI
  handleIdentifiersConstants(identifier: string): void {
    this.VCI.push(identifier);

    if (this.isReadln) {
      this.VCI.push('readln');
    }

    if (this.isPrintln) {
      this.VCI.push('println');
    }
  }

  //Método para ejecutar el VCI
  async executeExecStack(): Promise<void> {
    this.executionStack = [];
    this.identifierList = [];
    this.consoleText = '';
    this.isExecuting = true;

    for (let index = 0; index < this.VCI.length; index++) {
      const token = this.VCI[index];
      this.indexVci = index;

      await this.delay(this.milliseconds); // Delay entre instrucciones

      switch (token) {
        case '+':
          const add1 = this.executionStack.pop();
          const add2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const add1value = isNaN(Number(add1)) ? this.getVariableValue(add1) : Number(add1);
          const add2value = isNaN(Number(add2)) ? this.getVariableValue(add2) : Number(add2);
          this.executionStack.push(`${Number(add1value) + Number(add2value)}`);
          break;

        case '-':
          const sub1 = this.executionStack.pop();
          const sub2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const sub1value = isNaN(Number(sub1)) ? this.getVariableValue(sub1) : Number(sub1);
          const sub2value = isNaN(Number(sub2)) ? this.getVariableValue(sub2) : Number(sub2);
          this.executionStack.push(`${Number(sub2value) - Number(sub1value)}`);
          break;

        case '*':
          const mul1 = this.executionStack.pop();
          const mul2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const mul1value = isNaN(Number(mul1)) ? this.getVariableValue(mul1) : Number(mul1);
          const mul2value = isNaN(Number(mul2)) ? this.getVariableValue(mul2) : Number(mul2);
          this.executionStack.push(`${Number(mul1value) * Number(mul2value)}`);
          break;

        case '/':
          const div1 = this.executionStack.pop();
          const div2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const div1value = isNaN(Number(div1)) ? this.getVariableValue(div1) : Number(div1);
          const div2value = isNaN(Number(div2)) ? this.getVariableValue(div2) : Number(div2);
          this.executionStack.push(`${Number(div2value) / Number(div1value)}`);
          break;

        case '=':
          const variableValue = this.executionStack.pop();
          const variableName = this.executionStack.pop();
          const existingVariableIndex = this.identifierList.findIndex(id => id.variable === variableName);
          //Comprueba si las variables son nuevas o ya declaradas anteriormente
          if (existingVariableIndex !== -1) {
            this.identifierList[existingVariableIndex].value = variableValue;
          } else {
            this.identifierList.push({ variable: `${variableName}`, value: variableValue });
          }

          console.log("Lista de identificadores", this.identifierList)
          break;

        case '>':
          const greater1 = this.executionStack.pop();
          const greater2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const greater1value = isNaN(Number(greater1)) ? this.getVariableValue(greater1) : Number(greater1);
          const greater2value = isNaN(Number(greater2)) ? this.getVariableValue(greater2) : Number(greater2);
          this.executionStack.push(`${greater2value > greater1value}`);
          break;

        case '<':
          const less1 = this.executionStack.pop();
          const less2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const less1value = isNaN(Number(less1)) ? this.getVariableValue(less1) : Number(less1);
          const less2value = isNaN(Number(less2)) ? this.getVariableValue(less2) : Number(less2);
          this.executionStack.push(`${less2value < less1value}`);
          break;

        case '>=':
          const greaterequal1 = this.executionStack.pop();
          const greaterequal2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const greaterequal1value = isNaN(Number(greaterequal1)) ? this.getVariableValue(greaterequal1) : Number(greaterequal1);
          const greaterequal2value = isNaN(Number(greaterequal2)) ? this.getVariableValue(greaterequal2) : Number(greaterequal2);
          this.executionStack.push(`${greaterequal2value >= greaterequal1value}`);
          break;

        case '<=':
          const lessequal1 = this.executionStack.pop();
          const lessequal2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const lessequal1value = isNaN(Number(lessequal1)) ? this.getVariableValue(lessequal1) : Number(lessequal1);
          const lessequal2value = isNaN(Number(lessequal2)) ? this.getVariableValue(lessequal2) : Number(lessequal2);
          this.executionStack.push(`${lessequal2value <= lessequal1value}`);
          break;

        case '==':
          const equalequal1 = this.executionStack.pop();
          const equalequal2 = this.executionStack.pop();
          //Si los valores NO son numeros, probablemente sean identificadores
          //Comprueba si son numeros, si no los son busca el valor de los identificadores
          const equalequal1value = isNaN(Number(equalequal1)) ? this.getVariableValue(equalequal1) : Number(equalequal1);
          const equalequal2value = isNaN(Number(equalequal2)) ? this.getVariableValue(equalequal2) : Number(equalequal2);
          this.executionStack.push(`${equalequal2value === equalequal1value}`);
          break;

        case '&&':
          const and1 = this.executionStack.pop() || '';
          const and2 = this.executionStack.pop() || '';

          if (and1 === 'true' && and2 === 'true') {
            this.executionStack.push('true');
          } else {
            this.executionStack.push('false');
          }
          break;

        case '||':
          const or1 = this.executionStack.pop() || '';
          const or2 = this.executionStack.pop() || '';

          if (or1 === 'true' || or2 === 'true') {
            this.executionStack.push('true');
          } else {
            this.executionStack.push('false');
          }
          break;

        case '!':
          const not = this.executionStack.pop() || '';
          if (not === 'true') {
            this.executionStack.push('false');
          } else {
            this.executionStack.push('true');
          }
          break;

        case 'if':
          const directionIf = Number(this.executionStack.pop());
          const conditionIf = this.executionStack.pop();

          if (conditionIf === 'false') {
            index = directionIf - 1;
          }
          break;

        case 'else':
          const directionElse = Number(this.executionStack.pop());
          console.log("Dirección del else", directionElse)
          index = directionElse - 1;
          break;

        case 'println':
          let printValue: string = this.executionStack.pop() || '';

          //Condicion para formatear los strings (opcional)
          if (printValue.includes('"')) {
            printValue = printValue.slice(1, -1);
          }
          const printVariable = this.getVariableValue(printValue);
          this.consoleText += `${printVariable || printValue} \n`;
          break;

        case 'readln':
          const variableToRead = this.executionStack.pop() || '';
          const value = await this.openReadDialog(variableToRead);
          const existingVariableIndexRead = this.identifierList.findIndex(id => id.variable === variableToRead);

          //Comprueba si las variables son nuevas o ya declaradas anteriormente
          if (existingVariableIndexRead !== -1) {
            this.identifierList[existingVariableIndexRead].value = value;
          } else {
            this.identifierList.push({ variable: `${variableToRead}`, value });
          }
          break;

        case 'finDo':
          const directionDo = Number(this.executionStack.pop());
          const conditionDo = this.executionStack.pop() || '';

          if (conditionDo === 'true') {
            index = directionDo - 1;
          }
          break;

        case 'while':
          const directionWhile = Number(this.executionStack.pop());
          const conditionWhile = this.executionStack.pop() || '';

          if (conditionWhile === 'false') {
            index = directionWhile - 1;
          }
          break;

        case 'finW':
          const directionEndWhile = Number(this.executionStack.pop());
          index = directionEndWhile - 1;
          break;

        default:
          this.executionStack.push(token);
          break;
      }
    }
  }

  getVariableValue(variable: any): any {
    const id = this.identifierList.find(identifier => identifier.variable === variable);
    return id?.value ?? null;
  }

  openReadDialog(variableName: string): Promise<string> {
    return new Promise((resolve) => {
      this.ref = this.dialogService.open(ReadVariablesDialogComponent, {
        header: `Captura valor para '${variableName}'`,
        width: '30%',
        modal: true
      });

      this.ref.onClose.subscribe(data => {
        resolve(data ?? '');
      });
    });
  }

  //Metodo para cambiar la cantidad de milisegundos
  changeMilliseconds(event: ToggleEvent): void {
    if (event.checked) {
      this.changeMillisecondsDynamic()
    } else {
      this.milliseconds = 0;
    }
  }

  //Método para cambiar la cantidad de milisegundos
  changeMillisecondsDynamic(): void {
    this.milliseconds = (this.sliderValue / 100) * 5000;
  }
}
